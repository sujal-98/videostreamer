class Peers {
  constructor() {
    this.peer = new RTCPeerConnection({
      iceServers: [
        {
          urls: [
            "stun:stun.l.google.com:19302",
            "stun:global.stun.twilio.com:3478",
          ],
        },
      ],
    });
  }

  async getAnswer(offer) {
    await this.peer.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await this.peer.createAnswer(); // Fix: should be createAnswer()
    await this.peer.setLocalDescription(answer);
    return answer;
  }

  async setRemote(ans) {
    if (this.peer) {
      await this.peer.setRemoteDescription(new RTCSessionDescription(ans)); 
    }
  }
  

  async getOffer() {
    if (this.peer) {
      const offer = await this.peer.createOffer();
      await this.peer.setLocalDescription(offer);
      console.log("Offer generated:", offer);
      return offer; 
    }
  }
  
}

export default Peers;
