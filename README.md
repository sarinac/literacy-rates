# Global Literacy Rates between Female and Male Adults

This is my entry for the [Data Visualization Contest hosted by World Government Summit](https://wdvp.worldgovernmentsummit.org/). The World Government Summit Organization is a global, neutral, non-profit organization dedicated to shaping the future of governments. The original dataset is provided in a public [Google Sheets](https://docs.google.com/spreadsheets/d/1_xdns_UCtRNH9TWcxKYKa_HydlkZxbqCCYRfdxhUNpg/edit#gid=1693068612). I chose the topic of explaining the past: **What Just Happened?**

## Guidelines

* All entries must have the World Data Visualisation Prize logo somewhere on the layout.
* Make sure entries have a clear title, legend and other details to aid understanding.

## Set Up the Dataset

My workflow for data exploration, wrangling, and planning was done via Jupyter. I mainly used `pandas`, `matplotlib`, and `scipy`.

Create environment from the `data/environment.yml`.
```
conda env create -f data/environment.yml -n myenv
```
Activate environment.
```
conda activate myenv
```
Open Jupyter Lab.
```
jupyter lab
```

## Set Up the Visual

I used `d3.js` to draw. Run the following command to allow the browser to load files.
```
python -m http.server 8000 &
```
Then navigate to http://localhost:8000/.