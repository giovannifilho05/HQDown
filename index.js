const exif = require('jpeg-exif')
const fs = require('fs')
const PDFDocument = require('pdfkit')
const download = require('image-downloader')
const prompt = require('prompt')


let getImageResolution = function(imgPath){
  let resolution = new Object()
  
  const filePath = imgPath
  const data = exif.parseSync(filePath);
  resolution.ImageHeight = data.ImageHeight
  resolution.ImageWidth = data.ImageWidth

  return resolution
}

let downloadImg = async function (url, filename) {
  const options = {
    url,
    dest: filename                
  }
  await download
    .image(options)
    .then(() => console.log('Done >> ' + filename))
    .catch((err) => console.error('Ocorreu um erro inesperado na imagem: ' + filename + ' >> ' + err))
};

let createFolder = function (dirName) {
  if (!fs.existsSync(dirName)) {
    //Efetua a criação do diretório
    fs.mkdirSync(dirName);
  }
}

let saveImage = async function (baseLink, dirName) {
  createFolder(dirName)

  for (let img = 1; img <= 45; img++) {
    let url = new String()
    let filename = img + ".jpg"

    if (img >= 100) {
      url = baseLink + filename
    } else if (img >= 10) {
      url = baseLink + "0" + filename
    } else {
      url = baseLink + "00" + filename
    }

    await downloadImg(url, `${dirName}/${filename}`)
  }
}




let question = async function (question) {
  prompt.start();
  console.log('Cole o link base e em seguida, digite o nome para salvar a HQ.')
  prompt.get(['baseLink', 'dirName'], function (err, result) {
    generateHQ(result.baseLink, result.dirName)
  });
}


// generatePDF()
const generatePDF = async function (imgs, dirName) {
  
  console.log('Gerando PDF')

  const doc = new PDFDocument({ autoFirstPage: false})
  doc.pipe(fs.createWriteStream(`${dirName}.pdf`))

  console.log(imgs.length)
  for (let index = 0; index < imgs.length; index++) {

    console.log('Adicionando página ' + (index + 1))

    let imgPath = __dirname + '/' + dirName + '/' +imgs[index] + '.jpg'
    let resolution =  getImageResolution(imgPath)

    doc.addPage({size: [resolution.ImageWidth, resolution.ImageHeight]})

    doc.image(imgPath, 0, 0, {
      align: 'center',
      valign: 'center'
    })
  }
  
  console.log('PDF concluído.')

  doc.end();
}

let order = function (a, b) {
  if (a > b)
    return 1
  else if (a < b)
    return -1
  else { return 0 }
}


let generateHQ = async function (baseLink, dirName) {
  // await saveImage(baseLink, dirName)
  let arrayImg = fs.readdirSync(__dirname + '/' + dirName)
  
  let imgs = arrayImg.map((name) => {
    return parseInt(name.split('.')[0])
  }).sort(order)

  await generatePDF(imgs, dirName)
}

question()
