# Timelime - Interactive Timeline Component

A modern, interactive timeline component built with React and TypeScript that allows users to create, edit, and manage timeline items with drag-and-drop functionality.

## Features

- **Interactive Timeline**: Create and manage multiple timeline lanes
- **Drag & Drop**: Move timeline items between lanes or resize them
- **Item Editing**: Click on items to edit their names inline
- **Responsive Design**: Adapts to different screen sizes
- **Zoom Functionality**: Zoom in/out to see more or less detail
- **Visual Feedback**: Hover effects, drag previews, and visual indicators
- **Auto-lane Management**: Automatically creates new lanes when needed
- **Date-based Positioning**: Items are positioned based on their start and end dates

## Demo

The timeline component provides an intuitive interface for managing chronological data with:

- Color-coded items for easy identification
- Smooth animations and transitions
- Real-time drag preview
- Automatic overlap detection and lane management

## Installation

1. Clone the repository:
2. Install dependencies:

```bash
npm install
npm start
```

## Technologies

Built with modern web technologies:

- React 18+
- TypeScript
- CSS3
- HTML5
- Parcel 2
- Hooks

## Features

- Conflict recognition - Creates a new lane when trying to add items to the same hour in the same lane
- Create new lane - You can hover in the middle of two lanes to create a new one
- Drag and drop - Drag and drop items to change their dates or extend them
- Inline edit - Click on the labels to change their name

## Reasoning

- First I checked the AssignLanes and TimelineItems to know what I was working with
- Then rendered the list of items to see and compare dates, as well as compare the output of AssignLanes.
- Converted the project to Typescript to ease development
- Then I started working on rendering items horizontally, in lanes.
- As I started rendering the background lines to show dates, I realized several lanes had gaps in between items and had to fix.
- Initially I started adding invisible blocks, but eventually decided that absolute positioning would work best for both background lines and blocks.
- I tried to use as little AI as possible and did most of the work manually (except for drag and drop, just full AI'd that one :P. I've built similar implementations in the past, though.)
- Then by the end just refactored the code, since I mostly worked on a single Timeline file from the start.

## Known Issues

- Would need extra work to be functional in mobile. Probably very finnicky with drag and drop, as well as rendering.
- The hover to see small items makes the dragn'drop and the extend dates a little odd
- Could use Context to reduce passing props, but honestly it's just 1 level deep and I didn't think i'd be worth it.
- A little finnicky to edit after adding dragndrop. Probably need to add a long click to drag, for example.
