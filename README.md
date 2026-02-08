# **BEAT THE BEAT**
*Advanced Coding, Tools and Methodologies – A.Y. 2025/26*

*Professors: Francesco Bruschi, Vincenzo Rana*

Final project by UCETO –  
*Marzola Pier Matteo, Melioli Anna Chiara, Tortorella Elena*

---

## Outline
- [Purpose of the project](#purpose-of-the-project)
- [Game instructions](#game-instructions)
- [Implementation](#implementation)
- [Challenges](#challenges)
- [Link to the game page](#link-to-the-game-page)

---

## Purpose of the project

BEAT THE BEAT is an online game designed to challenge and improve rhythmic abilities.

Traditional music solfeggio is often perceived as boring. With different difficulty levels and practice modes, this game aims to be a fun and accessible tool to learn rhythm.

It is designed for different kinds of users:

- **Music beginners**: a simple and playful way to discover rhythmic notation, gaining confidence with note durations and subdivisions.
- **Children**: a colorful and engaging way to practice rhythmic skills, learning through imitation.
- **Anyone** who wants to improve tempo perception and timing accuracy, progressively playing faster while having fun.

---

## Game instructions

The game is structured as an infinite flow of 4/4 measures, alternating one measure to listen and one to play.

Each round consists of three steps:

1. **Follow the beat** – a simple beat-keeping exercise to establish a sense of timing.
2. **Listen and repeat** – a randomly generated rhythmic pattern is played by the game and must be reproduced by the user.
3. **Read the rhythm** – a new pattern is generated but not played; the user must perform it by reading the displayed rhythm.

After each round, the tempo increases by 6 BPM.

The score for each measure depends on rhythmic accuracy. Each mistake costs one life (out of three). When all lives are lost, the game ends.

At game over, players can save their score to the leaderboard, accessible anytime through the trophy button.

Difficulty is selected on the first page and affects rhythm generation (e.g., triplets and dotted notes appear at higher levels).  
The user can also customize the hit sound via the settings menu.

In addition to the main game, each mini-game can be played independently for focused practice (for example, only *Listen and Repeat*).

---

## Implementation

The web application is implemented using HTML, CSS, and JavaScript.  
An external real-time database is provided through Firebase.

Each page consists of an HTML file linked to its corresponding JavaScript logic and styled through a shared `style.css`.

### MVC Architecture

The project follows a simplified **Model–View–Controller (MVC)** pattern:

- **Model** (`GameModel.js`)  
  Stores the game state: score, BPM, round, lives, current rhythm pattern, and difficulty.

- **View** (`RhythmView.js` and UI files)  
  Handles visual rendering such as LEDs, rhythm notation, HUD updates, and modal screens.

- **Controller** (`GameController.js`)  
  Manages game flow, timing, user input evaluation, and communication between Model and View.

This separation improves maintainability and makes it easier to extend the game with new features or mini-games.

---

### Grammars

Difficulty selection determines which rhythmic grammar is used to generate measures.

The generator is implemented as a tree-based grammar:

- A measure (4 beats) is divided into half measures,
- each half into beats,
- and each beat into rhythmic figures (tree leaves).

Increasing difficulty simply adds rules and rhythmic possibilities to the grammar.

Each leaf rhythm is mapped to its duration value. Final timing is computed by multiplying these values by the current beat duration derived from BPM.

---

### Mini-games

Rhythmic patterns are generated whenever a new measure is required.

The three mini-games share a common structure and inherit from the abstract class `BaseRhythmMiniGame.js`.  
Each mini-game contains 8 beats: 4 played or counted by the game, followed by 4 beats where user input is expected.

1. **Follow the Beat** – fixed quarter notes.
2. **Listen and Repeat** – generated pattern is played, then reproduced.
3. **Read and Repeat** – generated pattern is displayed only.

All mini-game scripts are located in the `minigames` folder.

---

### User input

During gameplay, the system evaluates the timing of user hits against expected rhythmic events.

`GameController.js` manages timing and input detection, communicating with the active mini-game.

Inputs are classified using two tolerance windows relative to the expected hit time:

- ±10% of beat duration → *Perfect* (+100 points)
- ±20% → *Good* (+50 points)
- Outside these windows or missing hits count as errors

Only one life can be lost per measure, regardless of how many errors occur within it.

---

### Scores and Firebase

When all lives are lost, the game displays the reached round, BPM, and total score.

Players can save their score to an online leaderboard powered by Firebase.

Leaderboard data is handled through:

- `firebaseClient.js` – Firebase configuration
- `leaderboardService.js` – database read/write logic
- `leaderboardModal.html` + `leaderboardUI.js` – UI display

---

### Sounds

The settings menu allows users to select their hit sound (synth, clap, dog, or cat).

Sound management is handled by `GameSounds.js`, which controls:

- UI click sounds
- metronome
- hit feedback
- error sounds
- game over audio

---

## Challenges

The main challenges encountered during development were:

1. **Pattern generation**

   Designing scalable difficulty was solved through a grammar-based system. Instead of manually defining rhythms, we created a rule-based generator. Increasing difficulty simply means adding new grammar rules, producing richer rhythmic combinations with minimal code changes.

2. **Music notation**

   We aimed to display rhythms using traditional notation but could not find a lightweight library compatible with all browsers.  
   As a solution, we implemented a custom CSS-based notation system: notes are rendered as visual elements positioned proportionally within each beat. While simplified, this approach matches the pixel-art aesthetic of the game and remains intuitive.

3. **User input matching**

   Accurately evaluating rhythmic input in real time required precise timing logic.

   Our solution separates:

   - the *expected timing*, computed from the generated rhythm and BPM  
   - the *actual timing*, measured between consecutive user hits

   Each hit is compared directly against its corresponding expected timestamp, using tolerance windows to classify accuracy. This event-based approach allows real-time feedback while remaining robust to small timing fluctuations.

---

## Link to the game page

If you would like to try the game:

👉 https://meliolanna.github.io/ACTAM25/index.html

---

<p>
  <sub><i>
    BEAT THE BEAT – Academic project implemented by Marzola Pier Matteo, Melioli Anna Chiara and Tortorella Elena.<br>
    Finished in February 2026.
  </i></sub>
</p>
