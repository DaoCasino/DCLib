const path     = require('path')
const fs       = require('fs')
const archiver = require('archiver')
const inquirer = require('inquirer')
const exec     = require('child_process').exec

const filename = 'DC.js'
const projectPath = {
    dclib:       path.join(process.cwd(), '/api/lib/v2/' + filename),
    bankroller: {
        default:   path.join(__dirname, '../../../Applications/BankRollerDapp/BankRollerApp/DApps/'),
        lib:       path.join(__dirname, '../../../Applications/BankRollerDapp/BankRollerApp/DApps/dicedapp_v2/lib/'),
        archive:   path.join(__dirname, '../../../Applications/BankRollerDapp/BankRollerApp/DApps/dicedapp_v2') 
    }
}

console.clear()

function createlibInBnkRoller() {

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
            console.log('File true')
            fs.unlinkSync(projectPath.bankroller.lib + filename)
            createlibInBnkRoller()
        } else {
            console.log('file false')
            createlibInBnkRoller()
        }

    })
  
}

function zipExample () {

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
            type: 'list',
            message: 'Select tour platform',
            name: 'Platform',
            choices: ['Windows', 'Linux', 'MacOS', 'All']
        }).then(function (answers) {

            let platform = ''

            if (answers.Platform === 'Windows') platform = 'windows'

            if (answers.Platform === 'Linux') platform = 'linux'

            if (answers.Platform === 'MacOS') platform = 'mac'

            if (answers.Platform === 'All') buildAllPlatform()

            buildForPlatform(platform)

        })
    })

}

function buildForPlatform (platform) {

    console.clear()
    console.log('Start building for ' + platform)

    exec('cd /Volumes/fanyShu/projects/Applications/BankRollerDapp/BankRollerApp/; npm run build_electron_' + platform, (err, stdout, stderr) => {

        if (err) {
            console.log('Error: ', err)
            return
        }
        console.log('Stdout', stdout)
        console.log('Stderr', stderr)
    })
}

function buildAllPlatform() {

  console.clear()
  console.log('Start building for all platforms')

  exec('cd /Volumes/fanyShu/projects/Applications/BankRollerDapp/BankRollerApp/; npm run build_electron_windows; npm run build_electron_mac; npm run build_electron_linux', (err, stdout, stderr) => {

    if (err) {
        console.log('Error: ', err)
        return
    }
    console.log('Stdout', stdout)
    console.log('Stderr', stderr)
  })
}

deleteOldDCLib()
