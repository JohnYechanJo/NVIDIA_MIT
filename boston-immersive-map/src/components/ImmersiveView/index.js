import React from 'react';
import { useParams } from 'react-router-dom';

// If you’re using a custom viewer:
// import CustomNerfViewer from './CustomNerfViewer';

// Alternatively, if you’re just embedding an iframe from a Nerfstudio-hosted page:

function ImmersiveView() {
  const { siteId } = useParams();
  // Usually, you'd fetch the site data by ID to get the right Nerf link
  const videoUrl = `/videos/${siteId}.mp4`;
  
  return (
    // <div style={{ width: '100%', height: '100vh' }}>
    //   <iframe 
    //     src={urlToNeRF} 
    //     title={`NeRF of ${siteId}`} 
    //     width="100%" 
    //     height="100%" 
    //     frameBorder="0" />
    // </div>
    <div style={{ width: '100%', height: '100vh' }}>
      <video width="100%" height="100%" controls>
        <source src={videoUrl} type="video/mp4" />
      </video>
    </div>
  );
}

export default ImmersiveView;
