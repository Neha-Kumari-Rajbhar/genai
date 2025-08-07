//ai agent
import { GoogleGenAI } from "@google/genai";
import readlineSync from 'readline-sync';
import dotenv from "dotenv";
dotenv.config()

const History=[];
// Configure the client
const ai = new GoogleGenAI({apiKey:process.env.GEMINIKEY});

// Example Functions
async function getWeather({cityName}) {
  const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${cityName}&count=1`;
  const geoResponse = await fetch(geoUrl);
  const geoData = await geoResponse.json();

  if (!geoData.results || geoData.results.length === 0) {
    return { error: "City not found" };
  }

  const { latitude, longitude, name, country } = geoData.results[0];
  const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`;
  const weatherResponse = await fetch(weatherUrl);
  const weatherData = await weatherResponse.json();

  return {
    city: name,
    country: country,
    temperature: weatherData.current_weather.temperature,
    windspeed: weatherData.current_weather.windspeed,
    time: weatherData.current_weather.time
  };
}

async function getCryptoPrice({coin}) {
  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${coin}&vs_currencies=usd`;

    const response = await fetch(url);
    const data = await response.json();

    return {
      coin,
      price: data[coin]?.usd ?? 'Not Found'
    };
  
}

async function getNews({topic}) {
  const url = `https://api.rss2json.com/v1/api.json?rss_url=https://www.reddit.com/r/${topic}.rss`;

    const response = await fetch(url);
    const data = await response.json();

    const articles = data.items.slice(0, 5).map(item => ({
      title: item.title,
      link: item.link,
      pubDate: item.pubDate
    }));

    return articles;
  
}

function calculate({a, b, operator}) {
  switch (operator) {
    case '+': return a + b;
    case '-': return a - b;
    case '*': return a * b;
    case '/': return b !== 0 ? a / b : "Divide by zero error";
    // case '%' : return b!==0 ? a%b :"Divide by zero error";
    default: return "Invalid operator";
  }
}

const toolFunctions = {
  getWeather,
  getCryptoPrice,
  getNews,
  calculate
};

const tools = [
  {
    functionDeclarations: [
      {
        name: "getWeather",
        description:
          "Gets the current weather temperature for a given cityname.",
        parameters: {
          type: 'OBJECT',
          properties: {
            cityName: {
              type:'STRING',
              description:"It will be the string having name of city like Delhi"
            },
          },
          required: ["cityName"],
        },
      },
      {
        name: "getCryptoPrice",
        description: "Get the current price of any crypto currency like bitcoin.",
        parameters: {
          type: 'OBJECT',
          properties: {
            coin: {
              type: 'STRING',
              description:'It will be the string to find the crypto price like "bitcoin"'
            },
          },
          required: ["coin"],
        },
      },
      {
        name: "getNews",
        description: "Get the current news of any filed.",
        parameters: {
          type: 'OBJECT',
          properties: {
            topic: {
              type: 'STRING',
              description:'It will be the string to find the news like sports'
            },
          },
          required: ["topic"],
        },
      },
      {
        name: "calculate",
        description: "Get the calculated result of the given number based on give operator.",
        parameters: {
          type: 'OBJECT',
          properties: {
            a: {
              type: 'NUMBER',
              description:'It will be the number like 10'
            },
            b:{
                type:'NUMBER',
                description:'It will be the number like 20'
            },
            operator:{
                type:'STRING',
                description:'It will be the character as operator check if it is not vaild operator return give vaild operator'
            }
          },
          required: ['a', 'b', 'operator'],
        },
      },
    ],
  },
];



// Loop until the model has no more function calls to make
async function aiAgent(userProblem) {
    History.push({
        role:'user',
        parts:[{text:userProblem}]
    })
 while(true){
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents:History,
    config:{ 
      systemInstruction: `You are an AI agent. You have access of tools which are 
  getWeather--->to get weather of a city,
  getCryptoPrice--->get current crypto price of given coin,
  getNews--->get news related to given field,
  calculate--->perfome calculation
  you can use these tools if needed and if user asked general question
  you can give the answer directly by own

  `,
      tools },
  });

  //check is function call or not if not then print direct result
  if(response.functionCalls && response.functionCalls.length>0){
    const functionCall=response.functionCalls[0];
    const {name,args}=functionCall

    if(!toolFunctions[name]){
        throw new Error(`Unknown function call: ${name}`)
    }

    // Call the function and get the response.
    const funcall=toolFunctions[name];
    const result= await funcall(args)

    const functionResponsePart={
        name:functionCall.name,
        response:{
            result:result
        }
    }

    // Send the function response back to the model.
    History.push({
        role:'model',
        parts:[{
            functionCall:functionCall
        }]
    })

    History.push({
        role:'user',
        parts:[{
            functionResponse:functionResponsePart
        }]
    })

  }else{
    console.log(response.text)
    break;
  }
}
}
async function main() {
    const userProblem=readlineSync.question('Asked me anything---->');
    await aiAgent(userProblem);
    main();
}

main();