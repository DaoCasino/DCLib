process.env.BABEL_ENV = 'production'
process.env.NODE_ENV  = 'production'
require('./config/env')

const path     = require('path')
const fs       = require('fs')
const archiver = require('archiver')
const inquirer = require('inquirer')
const exec     = require('child_process').exec
const filename = 'DC.js'


const projectPath = {
	dclib:       path.join(__dirname, '../api/lib/v2/' + filename),
	bankroller: {
		default:   path.join(process.env.BAPath, './DApps/'),
		lib:       path.join(process.env.BAPath, './DApps/dicedapp_v2/lib/'),
		archive:   path.join(process.env.BAPath, './DApps/dicedapp_v2') 
	}
}

console.clear()


function createZip(foldername, folderpath, to) {

	return new Promise((resolve, reject) => {
		const output  = fs.createWriteStream(to)
		const archive = archiver('zip', {zlib: { level: 9 }})

		archive.on('error',  err=>{ 
			console.log('Compress ERROR: '+err) 
			reject( err )
		})

		archive.pipe(output)
		archive.directory(folderpath, foldername)
		archive.finalize()

		output.on('close', ()=>{
		  // console.log(archive.pointer() + ' total bytes');
		  // console.log('archiver has been finalized and the output file descriptor has closed.');
		  resolve()
		})
	})
}




function rebuildBankroller() {

	const buildingBankroller = function(){
		console.log(' ')
		console.log(' ')
		console.log('Building Bankroller...')


		return new Promise((resolve, reject) => {
			console.log('cd '+process.env.BAPath+' && npm run build')
			exec('cd '+process.env.BAPath+'; npm run build', (err, stdout, stderr) => {
				if (err) {
					console.log('Error: ', err)
					reject()
					return
				}

				console.log('Stdout', stdout)
				console.log('Stderr', stderr)
				resolve()
			}).stdout.on('data', console.log )
		}).then(() => {

			inquirer.prompt({
				type    : 'checkbox',
				message : 'Select tour platform',
				name    : 'Platform',
				choices : ['Windows', 'Linux', 'Mac']
			}).then(function (answers) {

				if (!answers.Platform.length) return

				const commandData = {
					platform: answers.Platform,
					pathFolder: 'cd '+process.env.BAPath,
					buildElectron: ''
				}

				commandData.buildElectron = (()=>{
					let commands = []
					commandData.platform.forEach(p=>{
						commands.push('npm run build_electron_' + p.toLowerCase() )	
					})
					return commands.join(' && ')
				})()

				const command = commandData.pathFolder +' && '+commandData.buildElectron
			
				console.log('Building for checked platforms...')
				console.log(command)

				exec(command, (err, stdout, stderr) => {
					if (err) {
						console.log('Error: ', err)
						return
					}
					if(stderr) console.log('Stderr', stderr)
				}).stdout.on('data', console.log )

			}).catch(err=>{
				console.log('answer error', err)
			})
		})
	}

	const createlibInBnkRoller = async function() {
		console.log('Creaetd DCLib for BankrollerApp started')

		const libCode = fs.readFileSync(projectPath.dclib)

		if (!libCode) return

		console.log('New lib created to BankRoller DApp')
		fs.writeFileSync(projectPath.bankroller.lib + filename, libCode)

		await createZip('dicedapp_v2', projectPath.bankroller.archive, projectPath.bankroller.default + 'example.zip')

		buildingBankroller()
	}


	fs.exists(projectPath.bankroller.lib + filename, exists => {
		if (exists) {
			fs.unlinkSync(projectPath.bankroller.lib + filename)
		}

		console.log('File true node script this file')
		createlibInBnkRoller()
	})
}


async function RUN(){

	console.clear()
	console.log('')
	console.log('Compress DC.js to ./dist/DC.zip ...')
	console.log('')
	await createZip('DCLib',  __dirname+'/../api/lib/v2/', __dirname+'/../dist/DC.zip')
	console.log('')

	const scripts = {
		'(Re)Build bankroller':()=>{
			rebuildBankroller()
		},
	}
	inquirer.prompt({
		type    : 'checkbox',
		message : 'Choose need actions',
		name    : 'actions',
		choices : Object.keys( scripts )
	}).then(answer => {
		if (!answer.actions || !answer.actions.length) return

		answer.actions.forEach(a=>{ scripts[a]() })
	})
}





RUN()
