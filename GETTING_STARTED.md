# Getting Started

Titans of War runs locally in your browser. You do not need an account, paid API key, or AI model.

## Option 1: Download Without Git

1. Open the project page:
   https://github.com/JCapone83/Titans_of_War
2. Click the green **Code** button.
3. Click **Download ZIP**.
4. Unzip the downloaded file.
5. Open the unzipped `Titans_of_War` folder.

Install Node.js if you do not already have it:

https://nodejs.org/

Use the current LTS version. Titans of War requires Node.js 20 or newer.

## Start on Mac

Double-click:

```text
Start_Titans_of_War.command
```

The first run installs the project dependencies. After that, it starts the local game server and opens a local browser address such as:

```text
http://127.0.0.1:5173
```

If macOS blocks the launcher because it was downloaded from the internet, Control-click the file, choose **Open**, then approve it.

## Start on Windows

Double-click:

```text
Start_Titans_of_War.bat
```

The first run installs the project dependencies. After that, it starts the local game server and opens a local browser address such as:

```text
http://127.0.0.1:5173
```

## Start From Terminal

Use this if you are comfortable with command lines:

```bash
npm install
npm start
```

Then open the local address printed in the terminal. It usually starts as:

```text
http://127.0.0.1:5173
```

## Optional Local AI

The game works without AI. If you have Ollama installed, the in-game local AI portal can discover local models. If not, ignore it and play the scripted campaign.

## Troubleshooting

- If the launcher says Node.js is missing, install Node.js from `https://nodejs.org/`.
- If the browser says the site cannot be reached, keep the launcher window open and use the local URL printed in that window.
- If port `5173` is already in use, the launcher will choose another local port and print the correct URL.
- To stop the game server, return to the launcher or Terminal window and press `Control-C`.
