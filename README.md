# make-world
Make a realistic world by simulating as many aspects as possible.

Latest build can be accesed here: https://nemo9955.github.io/make-world/pages/World.html


[![Build Status](https://travis-ci.com/nemo9955/make-world.svg?branch=master)](https://travis-ci.com/nemo9955/make-world)


## Keys
    LEFT MOUSE BUTTON is used to move the view inside a canvas and interact with GUI
    MIDDLE MOUSE BUTTON is for alternative zooming in some places
    LEFT MOUSE BUTTON is for clicking inse the canvas
    SHIFT is used to enable special scroll functionality in canvas, mostly zooming





## Features and priorities

    ✅ Robust framework with workers for paralelisation
    ✅ Complex event system for use with workers
    ✅ GUI to interact with the tool
    ✅ DB to hold information locally
    🌓 Linearly (re)generate world : Planet Sys -> Terrain -> Region -> Town
    🌑 Proper Save, Select & Load of worlds from local DB

    ✔️ Planetary system - functionally implemented
        ✔️ Realistic-ish formulas and rules for a few usable elements (Planets and Starts)
        ✔️ Complex structures like single/binary Start and single/multi Planets with 0/1/2+ Moons
        🌑 More complex generation with more Orbital Elements

    🌍 Planet terrain - under developement
        🌍 "Instantly" generated using noise
        🌑 Tectonic plates for more complex shapes

    🌓 Interaction between elements
        🌓 Heating of the Planets from the Star(s)
        🌑 Tidal forces
        🌑 Air and watter currents

    🌔 Regional terrain - better resolution, more proeminent features in a restricted zone
    🌓 Macro city and roads - Planet location of citys/towns and connecting roads/routes
    🌑 Micro citys/towns - basic layout with streets and buildings
    🌑 Building details - floors and layout







<!--
https://stackoverflow.com/questions/47344571/how-to-draw-checkbox-or-tick-mark-in-github-markdown-table
https://github.com/StylishThemes/GitHub-Dark/wiki/Emoji
https://gist.github.com/rxaviers/7360908 <<<<<<<<<<<<<<<<<<<<<<<<<<<<
 -->

## Lengend

    🌑 Not started, priority low
    🌓 Not started, priority medium
    🌔 Not started, priority high
    🌍 Worked on
    🐞 Implemented but bugggy
    ✔️ Done but needs feedback/refinment
    ✅ Done






