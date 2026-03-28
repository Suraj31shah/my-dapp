// Mock Pinata Upload for Development
// Setup a real Pinata account and replace with standard SDK configuration when ready for prod

export async function uploadToIPFS(metadata: Record<string, any>): Promise<string> {
  // If PINATA_JWT is not set, simulate IPFS upload Delay
  if (!process.env.NEXT_PUBLIC_PINATA_JWT) {
    console.warn("PINATA_JWT not set, returning mock IPFS hash.");
    await new Promise(resolve => setTimeout(resolve, 1000));
    return `ipfs://mockCID${Date.now()}`;
  }

  try {
    const res = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_PINATA_JWT}`,
      },
      body: JSON.stringify({
        pinataContent: metadata,
        pinataMetadata: {
          name: `TicketMetadata-${Date.now()}`,
        },
      }),
    });
    const data = await res.json();
    return `ipfs://${data.IpfsHash}`;
  } catch (error) {
    console.error("IPFS Upload Failed:", error);
    throw error;
  }
}
