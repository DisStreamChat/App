# DisTwitchChat App
This is the Chat client for DisTwitchChat. This app has many features that the [overlay](https://github.com/DisTwitchChat/Overlay) does not have.

# Framework/Tech use
* electron
* React
* Firebase

# Installation

## Install for Devolopment
1. Clone this repository.
```
git clone https://github.com/DisStreamChat/App.git <your-project-name>
```
2. Install Dependencies
```
npm install
```
3. If you havent already, install Yarn globally.
```
npm install -g yarn
```
4. Create a .env and add enviromnent variables from `.env.sample`. unless you are using a development version of the backend, the socket url should be set to `https://api.distwitchchat.com/`
5. Navigate into project root and install dependencies.
```
cd <your-project-name> && npm install
```
6. Run dev server.
```
npm run start
```

## Deploy Development version
1. Run the build process
```
npm run build
```
2. Go into your project folder using your file explorer. Navigate to the `dist` folder and open it. Then double-click `<your-project-name>` Setup 0.1.0. Your app should open and there should now be an icon on your desktop for this app.
