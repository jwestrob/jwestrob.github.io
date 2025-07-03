import React from 'react';
import './styles.css';

const CV = () => {
  return (
    <section className="cv-section">
      <h2>Curriculum Vitae</h2>
      <div className="cv-grid">
        {/* Left Column: Education + Technical Proficiencies */}
        <div>
          {/* Education */}
          <div className="cv-block">
            <h3>Education</h3>
            <div className="timeline-item">
              <span className="date">2018 - 2023</span>
              <h4>Ph.D. in Environmental Science, Policy and Management</h4>
              <p>University of California- Berkeley</p>
            </div>
            <div className="timeline-item">
              <span className="date">2016 - 2017</span>
              <h4>M.S. in Computational Biology</h4>
              <p>Carnegie Mellon University</p>
            </div>
            <div className="timeline-item">
              <span className="date">2012 - 2016</span>
              <h4>B.A. in Molecular, Cellular and Developmental Biology</h4>
              <p>University of Colorado at Boulder</p>
              <p>Minors in Math and Chemistry</p>
            </div>
          </div>

          {/* Technical Proficiencies */}
          <div className="cv-block">
            <h3>Technical Proficiencies</h3>
            <div className="skills-grid">
              <div className="skill-category">
                <h4>Programming Languages</h4>
                <ul>
                  <li>Python</li>
                  <li>Bash</li>
                  <li>R</li>
                  <li>Julia</li>
                  <li>C++</li>
                </ul>
              </div>
              <div className="skill-category">
                <h4>Fields of Expertise</h4>
                <ul>
                  <li>Metagenomics</li>
                  <li>Phylogenetics</li>
                  <li>Metatranscriptomics</li>
                  <li>Machine Learning</li>
                  <li>Metaproteomics</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Professional Experience */}
        <div>
          <div className="cv-block">
            <h3>Professional Experience</h3>
            <div className="timeline-item">
              <span className="date">2024 - Present</span>
              <h4>Consulting Computational Biologist</h4>
              <p>Sift Biosciences, San Carlos, CA</p>
              <ul>
                <li>Pipeline construction for identifying peptide targets for cancer immunotherapy vaccine development</li>
              </ul>
            </div>
            <div className="timeline-item">
              <span className="date">2024</span>
              <h4>Computational Biologist</h4>
              <p>Tatta Bio, Remote</p>
              <ul>
                <li>Development of genome context-aware similarity search webapp</li>
                <li>Creation of benchmarks for protein language model assessment</li>
              </ul>
            </div>
            <div className="timeline-item">
              <span className="date">2018 - 2023</span>
              <h4>Ph.D. Candidate</h4>
              <p>UC Berkeley - Banfield Lab</p>
              <ul>
                <li>Analysis of proteins from giant genes in candidate phylum Omnitrophota</li>
                <li>Metatranscriptomic and metagenomic analysis of montane soil datasets</li>
                <li>Development of scalable HMM-based metagenome annotation pipeline</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Publications Block */}
      <div className="publications-block">
        <div className="cv-block">
          <h3>
            Selected Publications
            <a href="http://dummy-scholar-link" target="_blank" rel="noopener noreferrer" style={{marginLeft: '8px'}}>
              <img src="https://scholar.google.com/favicon.ico" alt="Google Scholar" style={{width: '16px', height: '16px'}} />
            </a>
          </h3>
          <div className="publications">
            <div className="publication">
              <p>West-Roberts, J.A., et al. (2024). "Diverse Genomic Embedding Benchmark for functional evaluation across the tree of life". Biorxiv.</p>
            </div>
            <div className="publication">
              <p>West-Roberts, J.A., et al. (2023). "Giant genes are rare but implicated in cell wall degradation by predatory bacteria". Biorxiv.</p>
            </div>
            <div className="publication">
              <p>Al-Shayeb, B., et al. (2021). "Borgs are Giant Extrachromosomal Elements with the Potential to Expand Metabolic Capacity". Nature.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CV;