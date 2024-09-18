import React, { useEffect, useState } from 'react';
import Card from './card'; 
import './body.css';
import axios from 'axios';

const Body = () => {
  const [videos, setVideos] = useState([]);

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const response = await axios.get('http://localhost:1000/videos/fetch');
        setVideos(response.data);
      } catch (error) {
        console.log('Error fetching videos:', error);
      }
    };

    fetchVideos();
  }, []);

  return (
    <div className='body'>
      {videos.length > 0 ? (
        videos.map((video, index) => (
          <Card key={video._id} item={video} />  
        ))
      ) : (
        <p>No videos available</p>
      )}
    </div>
  );
};

export default Body;
