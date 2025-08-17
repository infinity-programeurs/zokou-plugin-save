// name: back4appStore
// description: Plugin pour stocker, récupérer, lister et supprimer du texte dans Back4App avec compteur
// version: 1.2.0
// author: Nathan & ChatGPT

const fetch = require("node-fetch");

const APP_ID = "TON_APP_ID_BACK4APP";       // Mets ton App ID Back4App
const JS_KEY = "TA_CLE_JS_BACK4APP";        // Mets ta clé JavaScript
const CLASS_NAME = "Messages";              // Nom de la table (classe) dans Back4App

module.exports = {
    commands: ["save", "get", "list", "delete"],
    usage: [
        "save <texte>   -> Sauvegarde le texte avec un compteur",
        "get <num>      -> Récupère un texte par numéro",
        "list           -> Liste tous les textes",
        "delete <num>   -> Supprime un texte par numéro"
    ],

    async onCommand(m, sock, args) {
        const cmd = args[0];
        const text = args.slice(1).join(" ");

        if (!cmd) {
            return m.reply("❌ Utilise: save <texte>, get <num>, list, ou delete <num>");
        }

        // Sauvegarder un texte avec compteur auto-incrémenté
        if (cmd === "save") {
            if (!text) return m.reply("❌ Donne un texte à sauvegarder !");
            
            try {
                // 1. Récupérer le dernier numéro
                let resCount = await fetch(`https://parseapi.back4app.com/classes/${CLASS_NAME}?order=-number&limit=1`, {
                    method: "GET",
                    headers: {
                        "X-Parse-Application-Id": APP_ID,
                        "X-Parse-JavaScript-Key": JS_KEY
                    }
                });
                let dataCount = await resCount.json();
                let lastNumber = dataCount.results.length > 0 ? dataCount.results[0].number : 0;
                let newNumber = lastNumber + 1;

                // 2. Sauvegarder le nouveau texte avec compteur
                await fetch(`https://parseapi.back4app.com/classes/${CLASS_NAME}`, {
                    method: "POST",
                    headers: {
                        "X-Parse-Application-Id": APP_ID,
                        "X-Parse-JavaScript-Key": JS_KEY,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ number: newNumber, content: text })
                });

                return m.reply(`✅ Texte #${newNumber} sauvegardé avec succès !`);
            } catch (err) {
                return m.reply("⚠️ Erreur lors de la sauvegarde: " + err.message);
            }
        }

        // Récupérer un texte par numéro
        if (cmd === "get") {
            if (!text) return m.reply("❌ Donne un numéro pour récupérer le texte !");
            
            try {
                let res = await fetch(`https://parseapi.back4app.com/classes/${CLASS_NAME}?where=${encodeURIComponent(JSON.stringify({ number: parseInt(text) }))}`, {
                    method: "GET",
                    headers: {
                        "X-Parse-Application-Id": APP_ID,
                        "X-Parse-JavaScript-Key": JS_KEY
                    }
                });
                let data = await res.json();
                if (data.results.length === 0) return m.reply("❌ Texte introuvable !");
                return m.reply(`📦 Texte #${data.results[0].number}: ${data.results[0].content}`);
            } catch (err) {
                return m.reply("⚠️ Erreur lors de la récupération: " + err.message);
            }
        }

        // Lister tous les textes
        if (cmd === "list") {
            try {
                let res = await fetch(`https://parseapi.back4app.com/classes/${CLASS_NAME}?order=number`, {
                    method: "GET",
                    headers: {
                        "X-Parse-Application-Id": APP_ID,
                        "X-Parse-JavaScript-Key": JS_KEY
                    }
                });
                let data = await res.json();
                if (data.results.length === 0) return m.reply("📭 Aucun texte enregistré !");
                
                let msg = "📋 Liste des textes:\n\n";
                data.results.forEach(r => {
                    msg += `#${r.number}: ${r.content}\n`;
                });
                return m.reply(msg);
            } catch (err) {
                return m.reply("⚠️ Erreur lors du listing: " + err.message);
            }
        }

        // Supprimer un texte par numéro
        if (cmd === "delete") {
            if (!text) return m.reply("❌ Donne un numéro à supprimer !");
            
            try {
                // 1. Trouver l’objet correspondant
                let res = await fetch(`https://parseapi.back4app.com/classes/${CLASS_NAME}?where=${encodeURIComponent(JSON.stringify({ number: parseInt(text) }))}`, {
                    method: "GET",
                    headers: {
                        "X-Parse-Application-Id": APP_ID,
                        "X-Parse-JavaScript-Key": JS_KEY
                    }
                });
                let data = await res.json();
                if (data.results.length === 0) return m.reply("❌ Texte introuvable !");
                
                let objectId = data.results[0].objectId;

                // 2. Supprimer
                await fetch(`https://parseapi.back4app.com/classes/${CLASS_NAME}/${objectId}`, {
                    method: "DELETE",
                    headers: {
                        "X-Parse-Application-Id": APP_ID,
                        "X-Parse-JavaScript-Key": JS_KEY
                    }
                });

                return m.reply(`🗑️ Texte #${text} supprimé avec succès !`);
            } catch (err) {
                return m.reply("⚠️ Erreur lors de la suppression: " + err.message);
            }
        }
    }
};
