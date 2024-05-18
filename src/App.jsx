import React, { useRef, useState } from 'react';
import {
  Box,
  Button,
  Flex,
  HStack,
  IconButton,
  Input,
  SkeletonText,
  Text,
} from '@chakra-ui/react';
import { FaLocationArrow, FaTimes } from 'react-icons/fa';
import {
  useJsApiLoader,
  GoogleMap,
  Marker,
  Autocomplete,
  DirectionsRenderer,
} from '@react-google-maps/api';

const center = { lat: 48.8584, lng: 2.2945 };

function App() {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: 'Your Key',
    libraries: ['places'],
  });

  const [map, setMap] = useState(null);
  const [directionsResponse, setDirectionsResponse] = useState(null);
  const [distance, setDistance] = useState('');
  const [duration, setDuration] = useState('');
  const [shortestRouteIndex, setShortestRouteIndex] = useState(null);

  const originRef = useRef();
  const destinationRef = useRef();

  if (!isLoaded) {
    return <SkeletonText />;
  }

  async function calculateRoute() {
    if (!originRef.current.value || !destinationRef.current.value) {
      return;
    }
    const directionsService = new google.maps.DirectionsService();
    const results = await directionsService.route({
      origin: originRef.current.value,
      destination: destinationRef.current.value,
      travelMode: google.maps.TravelMode.DRIVING,
      provideRouteAlternatives: true,
    });

    // Find the shortest route
    let shortestDistance = Number.MAX_VALUE;
    let shortestIndex = 0;
    results.routes.forEach((route, index) => {
      const routeDistance = route.legs.reduce((acc, leg) => acc + leg.distance.value, 0);
      if (routeDistance < shortestDistance) {
        shortestDistance = routeDistance;
        shortestIndex = index;
      }
    });

    setDirectionsResponse(results);
    setShortestRouteIndex(shortestIndex);

    // Assuming results.routes is not empty and contains at least one route
    setDistance(results.routes[shortestIndex].legs[0].distance.text);
    setDuration(results.routes[shortestIndex].legs[0].duration.text);
  }

  function clearRoute() {
    setDirectionsResponse(null);
    setDistance('');
    setDuration('');
    setShortestRouteIndex(null);
    originRef.current.value = '';
    destinationRef.current.value = '';
  }

  return (
    <Flex
      position="relative"
      flexDirection="column"
      alignItems="center"
      h="100vh"
      w="100vw"
    >
      <Box position="absolute" left={0} top={0} h="100%" w="100%">
        <GoogleMap
          center={center}
          zoom={15}
          mapContainerStyle={{ width: '100%', height: '100%' }}
          options={{
            zoomControl: false,
            streetViewControl: false,
            mapTypeControl: false,
            fullscreenControl: false,
          }}
          onLoad={setMap}
        >
          {directionsResponse &&
            directionsResponse.routes.map((route, index) => (
              <DirectionsRenderer
                key={index}
                directions={{ ...directionsResponse, routes: [route] }}
                options={{
                  polylineOptions: {
                    strokeColor: index === shortestRouteIndex ? 'green' : 'red',
                    strokeOpacity: 0.6,
                    strokeWeight: 6,
                  },
                }}
              />
            ))}
        </GoogleMap>
      </Box>
      <Box
        p={4}
        borderRadius="lg"
        m={4}
        bgColor="white"
        shadow="base"
        minW="container.md"
        zIndex="1"
      >
        <HStack spacing={2} justifyContent="space-between">
          <Autocomplete>
            <Input type="text" placeholder="Origin" ref={originRef} />
          </Autocomplete>
          <Autocomplete>
            <Input type="text" placeholder="Destination" ref={destinationRef} />
          </Autocomplete>
          <Button colorScheme="pink" onClick={calculateRoute}>
            Calculate Route
          </Button>
          <IconButton
            aria-label="Clear route"
            icon={<FaTimes />}
            onClick={clearRoute}
          />
        </HStack>
        {directionsResponse && (
          <HStack spacing={4} mt={4}>
            <Text>Distance: {distance}</Text>
            <Text>Duration: {duration}</Text>
            <IconButton
              aria-label="Center back"
              icon={<FaLocationArrow />}
              onClick={() => {
                map && map.panTo(center) && map.setZoom(15);
              }}
            />
          </HStack>
        )}
      </Box>
    </Flex>
  );
}

export default App;