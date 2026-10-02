# TripoBD Security Literature Review - Overleaf Package

This directory contains the complete, publication-ready LaTeX project for the academic literature review on TripoBD's security architecture.

## Included Files:
- `main.tex`: Full research paper formatted in standard academic two-column style.
- `references.bib`: Complete BibTeX database containing 28 formal academic citations (RFCs, NIST Special Publications, OWASP guidelines, IEEE/ACM papers).
- `README_OVERLEAF.md`: Instructions for compiling and importing.

## How to use in Overleaf:
1. Download `TripoBD_Security_Overleaf_Package.zip`.
2. Go to [Overleaf](https://www.overleaf.com/).
3. Click **New Project** -> **Upload Project**.
4. Select `TripoBD_Security_Overleaf_Package.zip`.
5. Overleaf will automatically open and compile `main.tex` using standard pdfLaTeX.

## Local Compilation:
To compile locally using MiKTeX / TeX Live:
```bash
pdflatex main.tex
bibtex main
pdflatex main.tex
pdflatex main.tex
```
