import { Planet } from '../types';

export const planets: Planet[] = [
  {
    name: 'Mercury',
    radius: 0.38,
    distance: 5.8,
    color: '#8C7853',
    rotationSpeed: 0.004,
    orbitSpeed: 0.02,
    tilt: 0.034
  },
  {
    name: 'Venus',
    radius: 0.95,
    distance: 10.8,
    color: '#FFC649',
    rotationSpeed: -0.002,
    orbitSpeed: 0.015,
    tilt: 3.1
  },
  {
    name: 'Earth',
    radius: 1,
    distance: 15,
    color: '#6B93D6',
    rotationSpeed: 0.01,
    orbitSpeed: 0.01,
    tilt: 0.41
  },
  {
    name: 'Mars',
    radius: 0.53,
    distance: 22.8,
    color: '#C1440E',
    rotationSpeed: 0.0097,
    orbitSpeed: 0.008,
    tilt: 0.44
  },
  {
    name: 'Jupiter',
    radius: 2.5,
    distance: 77.8,
    color: '#D8CA9D',
    rotationSpeed: 0.024,
    orbitSpeed: 0.002,
    tilt: 0.055
  },
  {
    name: 'Saturn',
    radius: 2.1,
    distance: 142.8,
    color: '#FAD5A5',
    rotationSpeed: 0.022,
    orbitSpeed: 0.0009,
    tilt: 0.47,
    rings: true
  },
  {
    name: 'Uranus',
    radius: 1.7,
    distance: 287.1,
    color: '#4FD0E7',
    rotationSpeed: 0.017,
    orbitSpeed: 0.0004,
    tilt: 1.71
  },
  {
    name: 'Neptune',
    radius: 1.6,
    distance: 449.5,
    color: '#4B70DD',
    rotationSpeed: 0.016,
    orbitSpeed: 0.0001,
    tilt: 0.49
  }
];

export const sunWavelengths = [
  { value: '304', label: '304Å', color: '#FFA500', description: 'He II - Chromosphere and transition region' },
  { value: '171', label: '171Å', color: '#FFD700', description: 'Fe IX - Quiet corona and upper transition region' },
  { value: '193', label: '193Å', color: '#00BFFF', description: 'Fe XII - Corona and hot flare plasma' },
  { value: '211', label: '211Å', color: '#FF69B4', description: 'Fe XIV - Active regions' },
  { value: '335', label: '335Å', color: '#00FF00', description: 'Fe XVI - Active regions and flares' },
  { value: '94', label: '94Å', color: '#8A2BE2', description: 'Fe XVIII - Flaring regions' }
];