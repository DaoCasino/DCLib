const path     = require('path')
const fs       = require('fs')
const archiver = require('archiver')
const inquirer = require('inquirer')
const exec     = require('child_process').exec
const filename = 'DC.js'
const projectPath = {
    dclib:       path.join(__dirname, '../api/lib/v2/' + filename),
    bankroller: {
        default:   path.join(__dirname, '../../../../Applications/BankRollerDapp/BankRollerApp/DApps/'),
        lib:       path.join(__dirname, '../../../../Applications/BankRollerDapp/BankRollerApp/DApps/dicedapp_v2/lib/'),
        archive:   path.join(__dirname, '../../../../Applications/BankRollerDapp/BankRollerApp/DApps/dicedapp_v2') 
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

    const output = fs.createWriteStream(projectPath.bankroller.default + 'example.zip')
    const archive = archiver('zip', {
        zlib: { level: 9 }
    })

    output.on('close', function () {
        console.log(archive.pointer() + ' total bytes')
        console.log('archiver has been finalized and the output file descriptor has closed.')
    })

    archive.on('error', function (err) {
        throw err
    })

    archive.pipe(output)
    archive.directory(projectPath.bankroller.archive, 'dicedapp_v2')
    archive.finalize()

    buildingBankroller()
}

function buildingBankroller() {

    return new Promise((resolve, reject) => {
        
        exec('cd /Volumes/fanyShu/projects/Applications/BankRollerDapp/BankRollerApp/; npm run build', (err, stdout, stderr) => {

            if (err) {
                console.log('Error: ', err)
                return
            }

                console.log('Stdout', stdout)
                console.log('Stderr', stderr)
                resolve()
        })
    }).then(() => {
      
        console.clear()

        inquirer.prompt({
            type: 'checkbox',
            message: 'Select tour platform',
            name: 'Platform',
            choices: ['Windows', 'Linux', 'Mac']
        }).then(function (answers) {

            const commandData = {
                platform: answers.Platform,
                pathFolder: 'cd /Volumes/fanyShu/projects/Applications/BankRollerDapp/BankRollerApp/; ',
                buildElectron: ''
            }

            for (let i = 0; i < commandData.platform.length; i++) {
                commandData.buildElectron += 'npm run build_electron_' + commandData.platform[i].toLowerCase() + '; '
            }

            const command = commandData.pathFolder + commandData.buildElectron

            var phrase = [
                'Hi =)',
                'How are you?', 
                'I"m postBuild script and I formating your hdd =)', 
                'I like jokes ;D', 
                'Please wait...', 
                'A few minutes more',
                'Soon... very soon',
                'Skynet? there is absolutely no I"m mouch better ^_^',
                'I forgot what I should do now well see, may be to destroy humanity oh, no, it"s better to collect the bankroller',
                'I"ve lost some of my files. I hope you"ll forgive me that',
                'Wait a little. I"m going to do everything now.'
            ]

            var phrasePost = setInterval(function () {
                var index = Math.floor(Math.random(phrase.length-1) * 10)
                console.clear()
                console.log(' ' + phrase[index])
            }, 2000)

            buildForPlatform(command, phrasePost)
        })
    })

}

function buildForPlatform (command, interval) {

    console.clear()
    console.log('building for check platform')

    exec(command, (err, stdout, stderr) => {

        if (err) {
            console.log('Error: ', err)
            return
        }

        clearInterval(interval)
        console.log('Stdout', stdout)
        console.log('Stderr', stderr)
    })
}

deleteOldDCLib()
