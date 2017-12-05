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

function createlibInBnkRoller() {

	console.log('Creaetd DCLib for BankrollerApp started')

	const libCode = fs.readFileSync(projectPath.dclib)

	if (libCode) {
		try {
			console.log('New lib created to BankRoller DApp')
			fs.writeFileSync(projectPath.bankroller.lib + filename, libCode)
			zipExample()
		} catch (error) {
			console.log('Error: ', error)
		}
	}

}

function deleteOldDCLib () {

	fs.exists(projectPath.bankroller.lib + filename, (exists) => {

		if (exists) {
			console.log('File true node script this file')
			fs.unlinkSync(projectPath.bankroller.lib + filename)
			createlibInBnkRoller()
		} else {
			console.log('File false, create new file')
			createlibInBnkRoller()
		}

	})
  
}

function zipExample () {

	console.log('Archivate started')
	console.log(' ')
	console.log(' ')

    const output = fs.createWriteStream(projectPath.bankroller.default + 'example.zip')
    const archive = archiver('zip', { zlib: { level: 9 } })

	output.on('close', function () {
		// console.log(archive.pointer() + ' total bytes')
		// console.log('archiver has been finalized and the output file descriptor has closed.')
	})

    archive.on('error', function (err) { throw err })

	archive.pipe(output)
	archive.directory(projectPath.bankroller.archive, 'dicedapp_v2')
	archive.finalize()

	buildingBankroller()
}

function buildingBankroller() {
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
			console.log('answer', answers)

			const commandData = {
				platform: answers.Platform,
				pathFolder: 'cd '+process.env.BAPath,
				buildElectron: ''
			}

			for (let i = 0; i < commandData.platform.length; i++) {
				commandData.buildElectron += 'npm run build_electron_' + commandData.platform[i].toLowerCase() + '; '
			}

			const command = commandData.pathFolder +' && '+commandData.buildElectron

			buildForPlatform(command)
		}).catch(err=>{
			console.log('answer error', err)
		})
	})
}

function buildForPlatform (command) {
	console.log('Building for checked platforms...')
	console.log(command)

	exec(command, (err, stdout, stderr) => {
		if (err) {
			console.log('Error: ', err)
			return
		}

		if(stderr) console.log('Stderr', stderr)
	}).stdout.on('data', console.log )
}

deleteOldDCLib()
