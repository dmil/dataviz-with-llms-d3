# dataviz-with-llms-d3

NICAR 2024 | AI 303: Visualizing data with large language models

For instructions and resources see https://data4news.com

## Usage

Click the button below to open this repository in GitHub Codespaces.
[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/github/docs)

- You can fill `index.html`, `style.css`, and `script.js` with the code ChatGPT gives you. 
- Hit the "Go Live" button on the bottom right side of the window to see your webpage in action.





## [Slides](https://docs.google.com/presentation/d/1f3INfweSXUMEqRyKGkDSPE4a2WGoIPda_Hz_yckvQDk/edit#slide=id.p)
## Initial Prompt 
> I have a CSV file named bills-with-nlp.csv with the following columns: State,Bill Number,Name,Summary,Bill Progress,Last Action,Action Date,keywords,embedding,x,y
>
> Show me the code to make a scatterplot in D3 with a tooltip. Each dot should be placed at x,y. When a user hovers on the tooltip, they should see the Bill Number,  Name, Last Action, and Action Date. And please add a search box that will let users filter by searching the Name column.
>
> Please provide the HTML, CSS and JS in separate files.


## Todos (for Dhrumil and Aarushi)
- [ ] Remove all Cowboy State Daily Specific Code 
- [x] Clean NLP notebook
- [ ] Throw slides together
- [x] Figure out initial prompt
- [ ] Figure out additional tasks (features for people to add)
- [ ] Make Prompt Bank (make sure it's what we want)
- [ ] Make sure all instructions are in README and can be followed
- [ ] Get this thing running in codespaces or tell them what we need in terms of setup (just vscode)

Nice to have
- [ ] Add all bills for MD (api key)
- [ ] More metadata for bills
- [ ] Other things to semantic map (like media)
- [ ] ChatGPT Buttons (summarize clusters w/ buttons)