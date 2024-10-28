////////////WARNING!!!////////////
//This project might not work,  //
//because when I made it, I used//
//My own api keys, and do not   //
//Want to share them.           //
//If it does not work, please refer to the video demo
//I also removed some of the stuff like location, api key, project ids, animations, etc. Those are available for you to see in the video demo.
//The one in the video demo is a completely different chrome extension, but goes under the same code as this one, plus my api keys, animations, and just ui tweaks. Thanks Google Cloud!



// Function to detect if a page is an article
async function isArticle(tabId) {
    try {
        const tabContent = await chrome.scripting.executeScript({
            target: { tabId: tabId },
            func: () => document.body.innerText
        });
        
        // Basic keyword matching to detect article
        const content = tabContent[0].result;
        const articleKeywords = ["by", "published", "author", "minutes read", "article"];
        return articleKeywords.some(keyword => content.includes(keyword));
    } catch (error) {
        console.error("Error detecting article:", error);
        return false;
    }
}

// Function to summarize text using Google Cloud API
async function summarizeText(text) {
    const location = "YOUR_LOCATION";
    const modelId = "t5-large"; // Adjust to the specific model as needed

    const response = await fetch(`https://${location}-aiplatform.googleapis.com/v1/projects/YOUR_PROJECT_ID/locations/${location}/publishers/google/models/${modelId}:predict`, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${await getAccessToken()}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            "instances": [{"content": text}],
            "parameters": {"temperature": 0.5, "maxOutputTokens": 50}
        })
    });

    const result = await response.json();
    return result.predictions ? result.predictions[0].content : "No summary available.";
}

// Function to get access token for authorization
async function getAccessToken() {
    return new Promise((resolve, reject) => {
        chrome.identity.getAuthToken({interactive: true}, (token) => {
            if (chrome.runtime.lastError || !token) {
                reject(chrome.runtime.lastError);
            } else {
                resolve(token);
            }
        });
    });
}

// Main function to run on page load
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.active) {
        const isPageArticle = await isArticle(tabId);
        if (isPageArticle) {
            const tabContent = await chrome.scripting.executeScript({
                target: {tabId: tabId},
                func: () => document.body.innerText
            });

            const summary = await summarizeText(tabContent[0].result);
            
            chrome.scripting.executeScript({
                target: {tabId: tabId},
                func: (summary) => {
                    const summaryDiv = document.createElement('div');
                    summaryDiv.style = "position:fixed;top:0;left:0;width:100%;background-color:white;color:black;padding:20px;z-index:10000;";
                    summaryDiv.innerText = summary;
                    document.body.appendChild(summaryDiv);
                },
                args: [summary]
            });
        }
    }
});
