const exif = require('jpeg-exif')
const fs = require('fs')
const download = require('image-downloader')
const prompt = require('prompt')
const request = require('request')
const cheerio = require('cheerio')
const PDFDocument = require('pdfkit')


let getImageResolution = function (imgPath) {
  let resolution = new Object()

  const data = exif.parseSync(imgPath);
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

let saveImage = async function (imgs, dirName) {
  createFolder(dirName)

  for (let img = 0; img < imgs.length; img++) {
    let filename = (img + 1) + ".jpg"
    await downloadImg(imgs[img], `${dirName}/${filename}`)
  }
}




let question = async function (question) {
  prompt.start();
  console.log('Cole o link da HQ e em seguida, digite um nome para salvar a HQ (sem espaço):')
  prompt.get(['baseLink', 'dirName'], function (err, result) {

    request(result.baseLink, function (err, res, body) {
      const img = new Array()

      if (err)
        console.log('Erro: ' + err)

      const $ = cheerio.load(body)

      $('div .col-sm-12.text-center img').each(function () {
        const link = $(this)[0]['attribs']['src']
        img.push(link)
      })

      generateHQ(img, result.dirName)
    })
  });
}


const generatePDF = async function (imgs, dirName) {

  console.log('Gerando PDF')

  const doc = new PDFDocument({ autoFirstPage: false })
  doc.pipe(fs.createWriteStream(`${dirName}.pdf`))

  for (let index = 0; index < imgs.length; index++) {
    console.log('Adicionando página ' + (index + 1))

    let imgPath = __dirname + '/' + dirName + '/' + imgs[index] + '.jpg'
    let resolution = await getImageResolution(imgPath)

    console.log(resolution)
    doc.addPage({ size: [resolution.ImageWidth, resolution.ImageHeight] })
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


let generateHQ = async function (imgs, dirName) {
  await saveImage(imgs, dirName)
  let arrayImg = fs.readdirSync(__dirname + '/' + dirName)

  let imgsName = arrayImg.map((name) => {
    return parseInt(name.split('.')[0])
  }).sort(order)

  await generatePDF(imgsName, dirName)
}

question()
