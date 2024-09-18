const fs = require('fs');
const path = require('path');

const express = require('express');
const Router = express.Router();
const Streams = require('../modal/streams'); 

Router.get('/fetch', async (req, res) => {
    try {
        const resp = await Streams.find({});
        
        if (resp.length > 0) {
            return res.status(200).json(resp); 
        } else {
            return res.status(404).json({ message: "No streams found" }); }
    } catch (error) {
        console.error("Error fetching streams:", error); 
        return res.status(500).json({ message: "An error occurred while fetching streams" });
    }
});

module.exports = Router;
