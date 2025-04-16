let map;
let currentSegments = [];

// Initialize the map
function initMap() {
    map = L.map('map').setView([44.5520, -69.6317], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Load initial segments
    loadSegments();
}

// Load segments based on current filters
async function loadSegments() {
    const searchText = document.getElementById('searchInput').value;
    const roadType = document.getElementById('roadTypeFilter').value;
    const hasSidewalk = document.getElementById('hasSidewalk').checked;
    const hasBikeLane = document.getElementById('hasBikeLane').checked;
    const safetyRating = document.getElementById('safetyRating').value;
    const trafficLevel = document.getElementById('trafficLevel').value;

    // Show loading state
    const segmentList = document.getElementById('segmentList');
    segmentList.innerHTML = '<div class="loading">Loading segments...</div>';

    try {
        const response = await fetch('/api/segments/filtered', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                searchText,
                roadType,
                hasSidewalk,
                hasBikeLane,
                safetyRating,
                trafficLevel
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.details || 'Failed to fetch segments');
        }

        const segments = await response.json();
        currentSegments = segments;
        
        if (segments.length === 0) {
            displayNoResultsMessage();
        } else {
            displaySegments(segments);
            displaySegmentsOnMap(segments);
        }
    } catch (error) {
        console.error('Error loading segments:', error);
        displayError(error.message);
    }
}

function displayNoResultsMessage() {
    const segmentList = document.getElementById('segmentList');
    segmentList.innerHTML = `
        <div class="no-results">
            <p>No segments found matching your criteria.</p>
            <p>Try adjusting your filters or search terms.</p>
        </div>
    `;
    
    // Clear the map
    map.eachLayer(layer => {
        if (layer instanceof L.Polyline) {
            map.removeLayer(layer);
        }
    });
}

function displayError(message) {
    const segmentList = document.getElementById('segmentList');
    segmentList.innerHTML = `
        <div class="no-results">
            <p>Error loading segments: ${message}</p>
            <p>Please try again or adjust your filters.</p>
        </div>
    `;
    
    // Clear the map
    map.eachLayer(layer => {
        if (layer instanceof L.Polyline) {
            map.removeLayer(layer);
        }
    });
}

// Display segments in the list
function displaySegments(segments) {
    const segmentList = document.getElementById('segmentList');
    segmentList.innerHTML = '';

    segments.forEach(segment => {
        const segmentElement = document.createElement('div');
        segmentElement.className = 'segment-item';
        
        // Safely handle length value
        let lengthDisplay = 'N/A';
        if (segment.length !== null && segment.length !== undefined) {
            lengthDisplay = typeof segment.length === 'number' 
                ? segment.length.toFixed(2) + ' miles'
                : segment.length + ' miles';
        }

        segmentElement.innerHTML = `
            <h3>${segment.name || 'Unnamed Road'}</h3>
            <p>Type: ${segment.road_type || 'Unknown'}</p>
            <p>Length: ${lengthDisplay}</p>
            <p class="safety-${segment.safety_rating ? segment.safety_rating.toLowerCase() : 'unknown'}">Safety: ${segment.safety_rating || 'Unknown'}</p>
            <p class="traffic-${segment.traffic_level ? segment.traffic_level.toLowerCase() : 'unknown'}">Traffic: ${segment.traffic_level || 'Unknown'}</p>
            <p>Sidewalk: ${segment.has_sidewalk ? 'Yes' : 'No'}</p>
            <p>Bike Lane: ${segment.has_bike_lane ? 'Yes' : 'No'}</p>
        `;

        segmentElement.addEventListener('click', () => {
            highlightSegment(segment);
        });

        segmentList.appendChild(segmentElement);
    });
}

// Display segments on the map
function displaySegmentsOnMap(segments) {
    // Clear existing layers
    map.eachLayer(layer => {
        if (layer instanceof L.Polyline) {
            map.removeLayer(layer);
        }
    });

    segments.forEach(segment => {
        const coordinates = JSON.parse(segment.geometry).coordinates;
        const latLngs = coordinates.map(coord => [coord[1], coord[0]]);
        
        const polyline = L.polyline(latLngs, {
            color: getSegmentColor(segment),
            weight: 3,
            opacity: 0.7
        }).addTo(map);

        polyline.on('click', () => {
            highlightSegment(segment);
        });
    });
}

// Get color based on segment properties
function getSegmentColor(segment) {
    if (segment.has_bike_lane) return '#4CAF50';
    if (segment.has_sidewalk) return '#2196F3';
    return '#FFC107';
}

// Highlight a segment on the map and in the list
function highlightSegment(segment) {
    // Remove existing highlights
    document.querySelectorAll('.segment-item').forEach(item => {
        item.style.backgroundColor = '';
    });

    // Highlight the selected segment in the list
    const segmentElements = document.querySelectorAll('.segment-item');
    const selectedElement = Array.from(segmentElements).find(element => 
        element.querySelector('h3').textContent === segment.name
    );
    if (selectedElement) {
        selectedElement.style.backgroundColor = '#f0f0f0';
    }

    // Center map on the segment
    const coordinates = JSON.parse(segment.geometry).coordinates;
    const bounds = coordinates.map(coord => [coord[1], coord[0]]);
    map.fitBounds(bounds);
}

// Add event listeners
document.addEventListener('DOMContentLoaded', () => {
    initMap();

    // Add event listeners to all filter controls
    const filterControls = [
        'roadTypeFilter',
        'hasSidewalk',
        'hasBikeLane',
        'safetyRating',
        'trafficLevel'
    ];

    filterControls.forEach(controlId => {
        const control = document.getElementById(controlId);
        if (control) {
            control.addEventListener('change', loadSegments);
        }
    });

    // Add search button click handler
    const searchButton = document.getElementById('searchButton');
    if (searchButton) {
        searchButton.addEventListener('click', loadSegments);
    }

    // Add debounced search for text input
    const searchText = document.getElementById('searchInput');
    let searchTimeout;
    searchText.addEventListener('input', () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(loadSegments, 500);
    });

    // Add Enter key handler for search input
    searchText.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            loadSegments();
        }
    });
}); 