/*for one line context

import { GoogleGenAI } from "@google/genai";
import dotenv from 'dotenv'
dotenv.config()

const ai = new GoogleGenAI({ apiKey: process.env.GEMINIKEY});

async function main() {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: "Explain stack in a few words",
  });
  console.log(response.text);
}

main();
*/

/*
//maintain a whole chat as context
import { GoogleGenAI } from "@google/genai";
import readlineSync from 'readline-sync';
import dotenv from 'dotenv'
dotenv.config()

const ai = new GoogleGenAI({ apiKey: process.env.GEMINIKEY });

const History=[]

async function Chatting(userProblem) {
    History.push({
        role:'user',
        parts:[{text:userProblem}]
    })

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: History,
  });

  History.push({
    role:'model',
    parts:[{text:response.text}],
  })

  console.log(response.text);
}

async function main() {
    const userProblem = readlineSync.question('Asked me anything-----> ');
    await Chatting(userProblem);
    main();
}
main();
*/

import { GoogleGenAI } from "@google/genai";
import readlineSync from 'readline-sync';
import dotenv from "dotenv";
dotenv.config()

const ai = new GoogleGenAI({ apiKey: process.env.GEMINIKEY});

const chat = ai.chats.create({
    model: "gemini-2.5-flash",
    history: [],
  });

async function main() {
    const userProblem = readlineSync.question('Asked me anything-----> ');
    const response = await chat.sendMessage({message:userProblem});
    console.log(response.text);
    main();
}
main();