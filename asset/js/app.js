let position = {}
let map
let markers
let tiles
const distance = 10000;
const adresseInput = document.getElementById('adresse');

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

    findAddress()

    positionUpdate()
}

const positionUpdate = () => {
    if (!map) {
        loadMap()
    }
    markers.clearLayers()
    L.marker([position.latitude, position.longitude])
        .addTo(markers)
        .bindPopup('Votre domicile est ici')
        .openPopup()

    let circle = L.circle([position.latitude, position.longitude], {
        color: 'red',
        radius: distance
    }).addTo(markers)

    let bigCircle = L.circle([position.latitude, position.longitude], {
        color: 'yellow',
        radius: 30000
    }).addTo(markers)

    map.fitBounds(circle.getBounds({
        padding: [5, 5]
    }))
}

const loadMap = () => {
    map = L.map('map').setView([position.latitude, position.longitude], 24)
    markers = L.layerGroup().addTo(map)
    tiles = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map)
}

const findAddress = () => {
    fetch(`https://api-adresse.data.gouv.fr/reverse/?lon=${position.longitude}&lat=${position.latitude}`)
        .then((response) => response.json())
        .then(response => {
            adresseInput.value = response.features[0].properties.label
        })
        .catch(err => handleMessage(err))
}


adresseInput.addEventListener('keyup', function (e) {
    const adresseValue = adresseInput.value.trim();
    if (adresseValue.length > 3) {
        fetch(`https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(adresseValue)}&limit=5`)
            .then(response => response.json())
            .then(response => {
                if (response.features.length > 1) {
                    const propositionsListeElement = document.getElementById('propositions')
                    propositionsListeElement.innerHTML = ''
                    propositionsListeElement.classList.add('touchable');
                    response.features.forEach((feature) => {
                        const proposition = document.createElement('li')
                        proposition.classList.add('proposition')
                        proposition.innerText = feature.properties.label
                        proposition.setAttribute('data-latitude', feature.geometry.coordinates[1])
                        proposition.setAttribute('data-longitude', feature.geometry.coordinates[0])
                        propositionsListeElement.append(proposition);
                        proposition.addEventListener('click', function(e) {
                            document.getElementById('adresse').value = e.target.innerText;
                            position.latitude = e.target.getAttribute('data-latitude')
                            position.longitude = e.target.getAttribute('data-longitude')
                            propositionsListeElement.innerHTML = '';
                            positionUpdate();
                         })
                    })

                } else {
                    document.getElementById('adresse').value = response.feature[0].properties.label;
                    document.getElementById('propositions').innerHTML = '';
                    position.latitude = response.features[0].geometry.coordinates[1]
                    position.longitude = response.features[0].geometry.coordinates[0]
                    positionUpdate()
                }
            })
            .catch(err => console.error(err))
    } else {
        document.getElementById('propositions').innerHTML = '';
    }
})

const handleMessage = (msg, type = 'error') => {
    console.log(`${type}: ${msg}`)
}

hasGeolocationSupport()