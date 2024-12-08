# **Rendu pour le projet de GS16**
## **Tutoriel pour lancer l'interface web**

Une fois téléchargé faites ceci pour pouvoir avoir accès à l'interface web :

```bash
cd [chemin]\GS16_Blockchain-main
npm install
npm run dev
```

Allez ensuite sur [http://localhost:3000](http://localhost:3000).

## **Tutoriel pour lancer l'Oracle JS**

```bash
cd [chemin]\GS16_Blockchain-main\RENDU
npm init -y
npm install express
npm install axios
node server.js
```

Allez ensuite sur http://localhost:3000/temperature?city=[VILLE].

Et changez "[VILLE]" dans l'adresse par une ville proposée dans la liste.

## **Tutoriel pour accéder au smart contrat :**

Allez chercher le fichier "[chemin]\GS16_Blockchain-main\RENDU\contract_v4.sol"

Ouvrez Remix (https://remix.ethereum.org/) et importez le contrat.

Compilez le contrat.

Allez dans "Deploy & Run transactions", sélectionnez l'envrionnement "Sepolia Testnet - MetaMask".

Collez l'adresse du Smart Contrat dans le cadre "At Address" (0xa8D47675db904256797e8A4F6DA1181ce855A2cE).

Cliquez sur "At Address" et le contrat apparaîtra dans "Deployed Contracts".

## **Vidéos de présentation**

Voici le lien pour la vidéo qui présente le smart contrat :

https://youtu.be/oJWuXdwGG_s

Voici le lien pour la vidéo qui présente l'interface web :

https://youtu.be/Wy5qOk_eAr4

Voici le lien de la vidéo qui présente l'Oracle JS :

https://youtu.be/HkO9nzRPX4o
