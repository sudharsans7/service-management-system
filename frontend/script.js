const API_URL = "http://localhost:5000/requests";

document.getElementById("requestForm").addEventListener("submit", async function (e) {
    e.preventDefault();

    const title = document.getElementById("title").value;
    const category = document.getElementById("category").value;

    await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, category })
    });

    this.reset();
    loadRequests();
});

async function loadRequests() {
    const res = await fetch(API_URL);
    const data = await res.json();

    const table = document.getElementById("requestTable");
    table.innerHTML = "";

    data.forEach(req => {
        table.innerHTML += `
            <tr>
                <td>${req.id}</td>
                <td>${req.title}</td>
                <td>${req.category}</td>
                <td>${req.status}</td>
                <td>${req.createdAt}</td>
            </tr>
        `;
    });
}

loadRequests();
