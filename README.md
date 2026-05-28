[index-final.html](https://github.com/user-attachments/files/28345045/index-final.html)
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Audit</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-900 text-white flex items-center justify-center min-h-screen">

<div class="p-6 bg-slate-800 rounded-xl w-full max-w-md">

<input id="url" class="w-full p-3 text-black" placeholder="https://site.com" />

<button onclick="run()" class="w-full mt-3 bg-indigo-600 p-3">Analyser</button>

<div id="out" class="mt-4"></div>

</div>

<script>
const API = "https://mon-moteur.onrender.com/api/analyze";

async function run(){
  const url = document.getElementById('url').value;

  const r = await fetch(API,{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body: JSON.stringify({url})
  });

  const d = await r.json();

  document.getElementById('out').innerHTML =
    "<h2>Score: "+d.score+"/100</h2>" +
    "<ul>" + (d.issues||[]).map(i=>"<li>"+i+"</li>").join("") + "</ul>";
}
</script>

</body>
</html>
