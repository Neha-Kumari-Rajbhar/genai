import {  GoogleGenAI } from "@google/genai";
import readlineSync from 'readline-sync'
import { promisify } from "node:util";
import { exec } from 'node:child_process'
import dotenv from 'dotenv'
import os from 'os'
import fs from 'fs';

dotenv.config()

const platform = os.platform();
//promise for execution command after completing the previous one
const execPromise=promisify(exec)

const History=[]
const ai=new GoogleGenAI({apiKey:process.env.GEMINIKEY})

//create a tool for executing terminal/shell command
async function executeCommand({command}){
    try {
       
        if (platform === "win32") {
        // Handle "touch"
        if (command.startsWith("touch ")) {
            const filePath = command.match(/touch\s+"(.+?)"/)[1];
            fs.writeFileSync(filePath, "", "utf8");
            console.log(`✅ File created: ${filePath}`);
            return `File created: ${filePath}`;
        }

        // Handle "echo"
        if (command.startsWith("echo ")) {
            const match = command.match(/^echo\s+"([\s\S]*)"\s+>\s+"(.+?)"$/);
            if (match) {
                const fileContent = match[1].replace(/\\"/g, '"'); // unescape quotes
                const filePath = match[2];
                fs.writeFileSync(filePath, fileContent, "utf8");
                console.log(`✅ File written: ${filePath}`);
                return `File written: ${filePath}`;
            }
        }
        }
        const {stdout,stderr}=await execPromise(command)
        if(stderr){
            console.log(`stderr:${stderr}`)
        }
        console.log(`stdout:${stdout}`)
        return stdout
    
    } catch (error) {
        console.log(`Error:${error}`)
    }
}

async function writeFile({ filePath, content }) {
    try {
        console.log("📄 Writing to file:", filePath);
        console.log("----------- File Content -----------");
        console.log(content);
        console.log("----------- End of Content -----------");

        fs.writeFileSync(filePath, content, "utf8");
        console.log(`✅ File written: ${filePath}`);
        return `File written: ${filePath}`;
    } catch (err) {
        console.error(`❌ Error writing file: ${err}`);
        return `Error writing file: ${err}`;
    }
}

const toolFunctions = {
    executeCommand,
    writeFile
};

  
const tools = [
  {
    functionDeclarations: [
        {
            name:'executeCommand',
            description:"Execute a single terminal/shell command.",
            parameters:{
                type:'OBJECT',
                properties:{
                    command:{ type:'STRING', description:'The shell command' }
                },
                required:['command']
            },
        },
        {
            name: 'writeFile',
            description: 'Write text content to a file',
            parameters: {
                type: 'OBJECT',
                properties: {
                    filePath: { type: 'STRING', description: 'Path to the file' },
                    content: { type: 'STRING', description: 'Text to write' }
                },
                required: ['filePath', 'content']
            }
        }
    ],
  },
];

async function cursorAi(userProblem) {
    History.push({
        role:'user',
        parts:[{text:userProblem}]
    })
while(true){
    const response= await ai.models.generateContent({
        model:"gemini-2.5-flash",
        contents: History ,
        config:{
            systemInstruction: `You are an Website builder expert. You have to create the frontend of the website by analysing the user Input.
        You have access of tool, which can run or execute any shell or terminal command.
         
        Current user operation system is: ${platform}
        Give command to the user according to its operating system ${platform} which support.
        
        If you want to create folders/files, use executeCommand.  
If you want to write content into a file, use writeFile with full content in one string.  
Do everything step-by-step until the website is fully ready.


            <----What is your job---->
            1:Analyse the user query to see what type of website they want to build
            2:Give them command one by one , step by step
            3:Use available tool executeCommand

            //Now you can give them command in following below
            1:First create a folder , Ex:mkdir "e-commerce"
            2:Inside the folder , create index.html, Ex:touch "e-commerce/index.html"
            3:Then create style.css same as above
            4:Then create script.js
            5:Then write a code in html file

            NEVER use echo to create/write files.
Instead, give me the content as plain text, and I will save it.

            You have yo provide the terminal or shell command to user, they will exectue it
            `,
            tools
        },
    })

    if (response.functionCalls && response.functionCalls.length > 0) {
    for (const funcall of response.functionCalls) {
        const { name, args } = funcall;

        if (!toolFunctions[name]) {
            throw new Error(`Unknown function call ${name}`);
        }

        const result = await toolFunctions[name](args);

        History.push({
            role: 'model',
            parts: [{ functionCall: funcall }]
        });

        History.push({
            role: 'user',
            parts: [{
                functionResponse: {
                    name: funcall.name,
                    response: { result }
                }
            }]
        });
    }
} else {
    History.push({
        role: 'model',
        parts: [{ text: response.text }]
    });
    console.log(response.text);
    break;
}

}
}

async function main(){
    const userProblem=readlineSync.question("What you want to create")
    await cursorAi(userProblem)
    main()
}

main()
