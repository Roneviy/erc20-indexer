import {
  Box,
  Button,
  Center,
  Flex,
  Heading,
  Image,
  Input,
  SimpleGrid,
  Text,
} from '@chakra-ui/react';
import { Alchemy, Network, Utils } from 'alchemy-sdk';
import { useState } from 'react';

function App() {
  const [userAddress, setUserAddress] = useState('');
  const [results, setResults] = useState([]);
  const [hasQueried, setHasQueried] = useState(false);
  const [tokenDataObjects, setTokenDataObjects] = useState([]);
  const [connectedAddress, setConnectedAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function connectWallet() {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
        setConnectedAddress(accounts[0]);
        console.log("Connected:", accounts);
        await getTokenBalance(accounts[0]);
      } catch (error) {
        console.error("Connect failed:", error);
        alert("Connect failed. Please enable MetaMask.");
        return;
      }
    } else {
      alert("MetaMask is not installed. Please install MetaMask to connect your wallet.");
      return;
    }
  }

  async function getTokenBalance(address) {
    setIsLoading(true);
  
    if (address.length !== 42) {
      alert("Wrong address!");
      console.error('Wrong address');
      setIsLoading(false);
      return;
    }
    
    const config = {
      apiKey: "YOUR_API_KEY",
      network: Network.ETH_MAINNET,
    };
  
    const alchemy = new Alchemy(config);
    let data;
  
    try {
      if (connectedAddress) {
        data = await alchemy.core.getTokenBalances(connectedAddress);
      } else {
        data = await alchemy.core.getTokenBalances(address);
      }
  
      if (data.tokenBalances.length === 0) {
        alert("This address does not exist!");
        console.error('Address does not exist');
        return;
      }
    
      setResults(data);
    
      const tokenDataPromises = [];
    
      for (let i = 0; i < data.tokenBalances.length; i++) {
        const tokenData = alchemy.core.getTokenMetadata(
          data.tokenBalances[i].contractAddress
        );
        tokenDataPromises.push(tokenData);
      }
    
      setTokenDataObjects(await Promise.all(tokenDataPromises));
      setHasQueried(true);
    } catch (error) {
      console.error("Error:", error.message);
      alert(error.message);
    } finally {
      setIsLoading(false);
    }
  }
  
  return (
    <Box w="100vw">
      <Center>
        <Flex
          alignItems={'center'}
          justifyContent="center"
          flexDirection={'column'}
        >
          <Button fontSize={15} onClick={connectWallet} mt={30} bgColor="blue">
            {connectedAddress ? connectedAddress : 'Connect Wallet'}
          </Button>
          <Heading mb={0} fontSize={36}>
            ERC-20 Token Indexer
          </Heading>
          <Text>
            Plug in an address and this website will return all of its ERC-20
            token balances!
          </Text>
        </Flex>
      </Center>
      <Flex
        w="100%"
        flexDirection="column"
        alignItems="center"
        justifyContent={'center'}
      >
        <Heading mt={42}>
          Get all the ERC-20 token balances of this address:
        </Heading>
        <Input
          onChange={(e) => setUserAddress(e.target.value)}
          color="black"
          w="600px"
          textAlign="center"
          p={4}
          bgColor="white"
          fontSize={24}
        />
        <Button fontSize={20} onClick={() => getTokenBalance(userAddress)} mt={36} bgColor="blue">
          Check ERC-20 Token Balances
        </Button>

        <Heading my={36}>ERC-20 token balances:</Heading>

        {isLoading ? (
          <div className="loader"></div>
        ) : (
          hasQueried ? (
            <SimpleGrid w={'60vw'} columns={4} spacing={24}>
              {results.tokenBalances.map((e, i) => {
                return (
                  <Flex
                    flexDir={'column'}
                    color="white"
                    w={'3vw'}
                    key={e.id}
                  >
                    <Box>
                      <b>Symbol:</b> ${tokenDataObjects[i].symbol}&nbsp;
                    </Box>
                    <Box>
                      <b>Balance:</b>&nbsp;
                      {Utils.formatUnits(
                        e.tokenBalance,
                        tokenDataObjects[i].decimals
                      )}
                    </Box>
                    <Image src={tokenDataObjects[i].logo} />
                  </Flex>
                );
              })}
            </SimpleGrid>
          ) : (
            'Please make a query! This may take a few seconds...'
          )
        )}
      </Flex>
    </Box>
  );
}

export default App;