---
layout: post
title:  "Week 3 Walkthrough- Metagenomic Assembly"
date:   2023-01-31
excerpt: "Metagenomic Assembly!"
project: "ESPM_112L"
tag:
- assembly
comments: true
---

# Hello and welcome to week 3 of ESPM 112L-

# Metagenomic Data Analysis Lab!

## Table of Contents

* TOC
{:toc}


Everybody, including (and especially) auditors, please join the lab slack [here](https://join.slack.com/t/espm112l2023/shared_invite/zt-1nqm83qn6-pJ9~hBwhdm_1U54zaU2blw)!! This will make it so much easier for me to get info, bug fixes, etc. out to you all at once.

This week we're going to be looking at metagenome assembly- what it is, how to do it, and best practices.

Your samples are enormous (some of the uncompressed .fastq files are >65GB!) so we're not going to be able to do metagenome assembly on all of these today.

What we are going to do is an overview of metagenome assembly- what it is, how to run it, and what software to use.

First, [here's a link](https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0169662) to a nice paper by Vollmers et al. that describes the most popular software packages for metagenome assembly. It'll be a nice resource for you in the future if you encounter this again.

Second, let's go over the methods we use in our lab and why we use them.

# Assembly methods

Our lab uses `idba_ud`, as we tend to get the best results with it (and it has a nice built-in scaffolder).
This is by no means a one-size-fits-all solution; different assemblers work to different degrees depending on the type of sample you're working with, its environment of origin, and your sequencing depth.

For a nice example, see the image below from the paper mentioned above:

<img src="https://journals.plos.org/plosone/article/figure/image?size=large&id=info:doi/10.1371/journal.pone.0169662.g002" width=250>

As you can see, different assemblers win out over others when looking at particular metrics, but none is consistently better every time on all metrics. Different scenarios call for different assembly software. MEGAHIT, for example, is quite memory efficient. If your computer is lacking in RAM, or your data is quite large, MEGAHIT can make assembly possible where it was previously infeasible due to memory constraints.

It's up to you to decide which one is best for your particular situation, based on the particular traits of each assembler (which are well described in the Vollmers et al. paper above).

We can see the effect of using different assemblers on our data, too. I ran `megahit` and `metaSPAdes` for one of our class samples, `Cow_8_05`. Here's what the stats look like in comparison:

---

|  Assembly Statistic | MEGAHIT      | metaSPAdes |
| ----------- | ----------- | ----------- |
| # Contigs           | 679859       |    2448126     |
| N50                 | 1231 bp   |   578 bp      |
| Average Sequence Length | 901.35 bp  | 453.59 bp  |
|  Largest Contig     |     429190   |  502671     |

---

Our lab uses either `metaSPAdes`, `idba_ud`, or `MEGAHIT`; today we'll be using `metaSPAdes`.

---

# Section 1: Assembly

First, we're going to set up a practice assembly. Navigate to `/class_data/example_assembly` and take a look at what's there. You'll see two files:

```
jwestrob@class:/class_data/example_assembly$ ls

Cow_8_05_trim_clean.subsample.1.fastq.gz  Cow_8_05_trim_clean.subsample.2.fastq.gz
```

Here we have a subset of both the forward and reverse reads from the sample `Cow_8_05`, which none of the groups have been assigned. Here we have 500,000

## Subsection: Assembly prep

Now we're going to prepare to run an assembly. Choose your reads, and do the following:

- ```ln -s /class_data/example_assembly/*.fastq.gz ~```


This will create what's called a *symbolic link* in your home directory (your home directory is symbolized by `~`) - it's like copying over a file, but you don't actually make a new copy. You can just see the filename and operate on it as if you had copied it. If you remove this link, the original will be safe and sound in its original directory.

## The Assembly Command

Now, we're going to do actual assembly. Remember, **only one person per group should execute one of the following commands! We only have so many compute resources.**


```
#This navigates to your home directory
cd ~
#This displays the help for metaspades
metaspades.py -h
```

Take a look at some of these options.

```
SPAdes genome assembler v3.15.0 [metaSPAdes mode]

Usage:  metaspades.py [options] -o <output_dir>

Basic options:
  -o <output_dir>             directory to store all the resulting files (required)
  --iontorrent                this flag is required for IonTorrent data
  --test                      runs SPAdes on toy dataset
  -h, --help                  prints this usage message
  -v, --version               prints version

Input data:
  --12 <filename>             file with interlaced forward and reverse paired-end reads
  -1 <filename>               file with forward paired-end reads
  -2 <filename>               file with reverse paired-end reads
  -s <filename>               file with unpaired reads
  --merged <filename>         file with merged forward and reverse paired-end reads
```

So you're going to need at least two things to run metaSPAdes:
- Reads to assemble (your `fastq` files)
- The name of an output directory

Here's how that command should look:

```
metaspades.py -t 4 -1 [forward reads] -2 [reverse reads] -o [output_directory name]
```

Let's run through these options one by one.

- `-t` : The number of threads (separate processes) allotted to the program.
- `-1` : The file containing the forward reads.
- `-2` : The file containing the reverse reads.
- `-o` : The name of the directory to output your assembly to. I suggest `metaspades_out`.


With the standard parameters, assembling the example reads with 4 threads took about 2 minutes. This sample takes ~24 seconds to assemble with `MEGAHIT`.

*Please do not run this with more than 4 threads!*


---

# Section 2: Assembly Statistics

We're going to use a script called `contig_stats.pl`, written in perl, to generate assembly statistics.

Navigate to your metaspades output directory (e.g. `cd metaspades_out`), and take a look at the files metaspades generated. Here's an example output:

```
jwestrob@class:/class_data/example_assembly/metaspades_out$ ls

assembly_graph_after_simplification.gfa  corrected               K55             run_spades.yaml
assembly_graph.fastg                     dataset.info            misc            scaffolds.fasta
assembly_graph_with_scaffolds.gfa        first_pe_contigs.fasta  params.txt      scaffolds.paths
before_rr.fasta                          input_dataset.yaml      pipeline_state  spades.log
contigs.fasta                            K21                     quast_out       strain_graph.gfa
contigs.paths                            K33                     run_spades.sh   tmp

```

You'll notice a lot of different unfamiliar files, but two that should hopefully stand out: `contigs.fasta` and `scaffolds.fasta`. We want `scaffolds.fasta` - remember, contigs are stitched together to make scaffolds.

Let's run `contig_stats.pl` to get a good idea of how well the assembly ran-

```
#This command will generate a file called 'scaffolds.contigstats.summary.txt'
contig_stats.pl -i scaffolds.fasta -o scaffolds.contigstats
```

Let's look now at the resulting contig stats- try `less scaffolds.contigstats.summary.txt`. You'll see something like this:

```
Length distribution
===================

Range    	# sequences (%)	# bps (%)
0-100:  	190 (0.24%)	14076 (0.04%)
100-500:  	65811 (83.44%)	17993525 (60.05%)
500-1000:  	10091 (12.79%)	6788583 (22.65%)
1000-5000:  	2694 (3.41%)	4317525 (14.4%)
5000-10000:  	70 (0.08%)	459324 (1.53%)
10000-20000:  	11 (0.01%)	144408 (0.48%)
20000-50000:  	3 (0%)	81549 (0.27%)
50000-:     	2 (0%)	163131 (0.54%)

General Information
==================

Total number of sequences: 78872
Total number of bps:       29962121
Average sequence length:   379.88 bps.
N50:                       364 bps
```

## Interpreting assembly statistics

Important stats to remember are:

- N50 (Median contig size; half of contigs are above this size, half below)

- Average sequence length

- Total number of sequences (you want fewer, larger contigs!)

- Number of large (50,000+ bp) contigs

## Getting assembly statistics for your sample

- Take a look at the assembly directory for your sample (e.g. `/class_data/assemblies/Cow_8_05_idba_ud` or similar). *If you don't remember your sample ID ask me for help!*

- Using the procedure above, generate contig stats for your scaffold file (`[samplename]_scaffold.fa`).

# Questions for today's turn-in:

1. What is the N50 of the contigs (*not* the scaffolds) from the example assembly? (Go back and repeat the procedure to run `contig_stats.pl` on the scaffolds from the example assembly, but choose `contigs.fasta` instead of `scaffolds.fasta`) *5pts*

2. What differentiates contigs from scaffolds? Should an assembly yield more scaffolds than contigs, or vice versa? *3pts*

3. What is the length of the largest contig in your sample's idba_ud assembly? *2pts*

4. Provide the path (file location) of your example assembly output. *10pts*


---

You did it!

![You get a genome!](https://i1.wp.com/i.imgflip.com/v80vq.jpg?resize=640%2C359&ssl=1)

*Source: [The Molecular Ecologist](https://www.molecularecologist.com/2015/12/post-holiday-gift-ideas-a-draft-genome/)*
