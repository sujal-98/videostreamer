import React, { useEffect, useState } from 'react';
import Card from './card'; 
import './body.css';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Body = () => {
  const [videos, setVideos] = useState([]);
  const navigate=useNavigate();

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const response = await axios.get('http://localhost:1000/videos/fetch');
    console.log("video",response)
        setVideos(response.data);
      } catch (error) {
        console.log('Error fetching videos:', error);
      }
    };

    fetchVideos();

  }, []);


  const handleView=async (id,like,dislike,impression)=>{
    navigate(`/globalviewer`,{
      state:{
        room:id,
        likes:like,
        dislikes:dislike,
        impressions:impression
      }
    })
  }

  return (
    <>

    <div className='body'>
      {videos.length > 0 ? (
        videos.map((video, index) => (
          
          <section onClick={()=>{handleView(video.room,video.likes,video.dislikes,video.impressions)}}>
          <Card key={video._id} item={video} />
          </section>  
        ))
      ) : (
        <p>No videos available</p>
      )}
    </div>
    </>);
};

export default Body;
