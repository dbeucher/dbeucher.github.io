let position
let map
let markers
let tiles

const hasGeolocationSupport = () => {
    if (!navigator.geolocation) {
        handleMessage('Votre navigateur ne supporte pas la géolocalisation')
    } else {
        getCurrentLocation()
    }
}

const getCurrentLocation = () => {
    navigator.geolocation.getCurrentPosition(geolocationPosition => {
        position = {
            latitude: geolocationPosition.coords.latitude,
            longitude: geolocationPosition.coords.longitude
        }
        initMap()
    }, handleMessage, {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
    })
}

const initMap = () => {
    loadMap()
    tiles = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map)

    findAddress()

    tiles.once('load', () => {
        positionUpdate()
    })
}

const positionUpdate = () => {
    markers.clearLayers()
    L.marker([position.latitude, position.longitude])
        .addTo(markers)
        .bindPopup('Votre domicile est ici')
        .openPopup()

    let circle = L.circle([position.latitude, position.longitude], {
        color: 'red',
        radius: 1000
    }).addTo(markers)

    map.fitBounds(circle.getBounds({
        padding: [5, 5]
    }))
}

const loadMap = () => {
    map = L.map('map').setView([position.latitude, position.longitude], 20)
    markers = L.layerGroup().addTo(map)
}



const findAddress = () => {
    fetch(`https://api-adresse.data.gouv.fr/reverse/?lon=${position.longitude}&lat=${position.latitude}`)
        .then((response) => response.json())
        .then(response => {
            document.getElementById('adresse').value = response.features[0].properties.label
        })
        .catch(err => handleMessage(err))
}

document.getElementById('adresse').addEventListener('change', function (e) {
    const adresseName = e.target.value
    fetch(`https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(adresseName)}`)
        .then(response => response.json())
        .then(response => {
            position.latitude = response.features[0].geometry.coordinates[1]
            position.longitude = response.features[0].geometry.coordinates[0]
            positionUpdate()
        })
        .catch(err => console.error(err))
})

const handleMessage = (msg, type = 'error') => {
    console.log(`${type}: ${msg}`)
}

hasGeolocationSupport()