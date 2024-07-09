import React from 'react';
import items from '../resources/videos';
import Card from './card';
import './body.css';

const Body = () => {
  return (
    <div className='body'>
      {items.map((item, index) => (
        <Card key={index} item={item} />
      ))}
    </div>
  );
}

export default Body;
