// ✅ Your deployed backend URL
const API_URL = "https://umar-k20u.onrender.com";  

// Function to run AI command
async function runCommand() {
    const command = document.getElementById("command_input").value.trim();
    
    if(!command){ 
        alert("Please enter command"); 
        return; 
    }
    
    const resultBox = document.getElementById("result");
    resultBox.innerHTML = "Running AI system...";

    try {
        const res = await fetch(`${API_URL}/command`, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({command})
        });

        const r = await res.json();

        // Backend returned error
        if(r.status === "error"){
            resultBox.innerHTML = `<p style="color:red">Error: ${r.message}</p>`;
            console.error(r.trace || r.message);
            return;
        }

        // Products field may not exist in backend
        const productsList = r.products ? r.products.map(p => p.name).join(", ") : "N/A";

        // Display result in frontend
        resultBox.innerHTML = `
        <div class="card">
            <h3>Selected Niche</h3>
            <p>${r.niche}</p>

            <h3>Keywords</h3>
            <p>${r.keywords.join(", ")}</p>

            <h3>Products</h3>
            <p>${productsList}</p>

            <h3>Blog URL</h3>
            <a href="${r.blog_url}" target="_blank">${r.blog_url}</a>
        </div>`;
        
    } catch(e){
        console.error("Frontend error:", e);
        resultBox.innerHTML = "<p style='color:red'>Server error. Check console for details.</p>";
    }
}
