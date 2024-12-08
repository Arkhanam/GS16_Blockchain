'use client'

import React, { useState, useEffect } from 'react'
import Web3 from 'web3'
import { Bell, ArrowUp, Star } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { contractABI } from '../contractABI';

const contractAddress = '0xa8D47675db904256797e8A4F6DA1181ce855A2cE' // Replace with your actual contract address

const categories = [
  { id: 1, name: 'Breaking News', color: 'bg-blue-500' },
  { id: 2, name: 'US Elections', color: 'bg-red-500' },
  { id: 3, name: 'Sports', color: 'bg-green-500' },
  { id: 4, name: 'Entertainment', color: 'bg-purple-500' },
]

const initialBets = [
  {
    id: 1,
    question: "Who will be elected President in 2024?",
    yesProb: 0.5,
    noProb: 0.5,
    volume: BigInt(0),
    participants: BigInt(0),
    category: 'US Elections',
    favorite: false,
  },
  {
    id: 2,
    question: "Will it rain in New York on July 4th?",
    yesProb: 0.5,
    noProb: 0.5,
    volume: BigInt(0),
    participants: BigInt(0),
    category: 'Breaking News',
    favorite: false,
  },
]

export default function BettingPlatform() {
  const [web3, setWeb3] = useState<Web3 | null>(null)
  const [contract, setContract] = useState<any>(null)
  const [account, setAccount] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [sortBy, setSortBy] = useState('volume')
  const [bets, setBets] = useState(initialBets)
  const [selectedBet, setSelectedBet] = useState<any>(null)
  const [betAmount, setBetAmount] = useState('')
  const [betOption, setBetOption] = useState<'Yes' | 'No'>('Yes')

  useEffect(() => {
    const initWeb3 = async () => {
      if (typeof window !== 'undefined' && typeof (window as any).ethereum !== 'undefined') {
        try {
          await (window as any).ethereum.request({ method: 'eth_requestAccounts' })
          const web3Instance = new Web3((window as any).ethereum)
          setWeb3(web3Instance)

          const accounts = await web3Instance.eth.getAccounts()
          setAccount(accounts[0])

          const contractInstance = new web3Instance.eth.Contract(contractABI, contractAddress)
          setContract(contractInstance)

          const networkId = await web3Instance.eth.net.getId()
        } catch (error) {
          console.error("Failed to load web3, accounts, or contract. Check console for details.")
          alert("Failed to connect to Ethereum network. Please make sure you have MetaMask installed and connected to the Sepolia network.")
        }
      } else {
        console.log('Please install MetaMask!')
        alert("Please connect your wallet.");
      }
    }

    initWeb3()

    if (localStorage.getItem('walletConnected') === 'true') {
      connectWallet()
    }

    if (typeof window !== 'undefined' && typeof (window as any).ethereum !== 'undefined') {
      (window as any).ethereum.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length > 0) {
          setAccount(accounts[0])
        } else {
          disconnectWallet()
        }
      })
    }

    return () => {
      if (typeof window !== 'undefined' && typeof (window as any).ethereum !== 'undefined') {
        (window as any).ethereum.removeAllListeners('accountsChanged')
      }
    }
  }, [])

  
  const connectWallet = async () => {
    if (typeof window !== 'undefined' && typeof (window as any).ethereum !== 'undefined') {
      try {
        if (!web3) {
          const web3Instance = new Web3((window as any).ethereum)
          setWeb3(web3Instance)
        }
        const accounts = await (window as any).ethereum.request({ method: 'eth_requestAccounts' })
        setAccount(accounts[0])

        if (web3) {
          const contractInstance = new web3.eth.Contract(contractABI, contractAddress)
          setContract(contractInstance)
        }

        alert("Your wallet has been successfully connected.")
        localStorage.setItem('walletConnected', 'true')
      } catch (error) {
        console.error("Failed to connect wallet:", error)
        alert("Failed to connect your wallet. Please try again.")
      }
    } else {
      console.log('Please install MetaMask!')
      alert("Please install MetaMask to use this dApp.")
    }
  }

  const disconnectWallet = () => {
    setAccount(null)
    setWeb3(null)
    setContract(null)
    localStorage.removeItem('walletConnected')
    alert("Your wallet has been successfully disconnected.")
  }

  const placeBet = async () => {
    console.log("Attempting to place bet...");
    if (!web3 || !contract || !account) {
      console.error("Wallet not connected");
      alert("Please connect your wallet to place a bet.")
      return;
    }

    if (!betAmount || isNaN(parseInt(betAmount))) {
      console.error("Invalid bet amount");
      alert("Please enter a valid bet amount in wei.")
      return;
    }


    try {
      console.log(`Placing bet: ${betAmount} wei on ${betOption}`);
      const amountInWei = BigInt(betAmount);
      console.log(`Amount in Wei: ${amountInWei}`);

      const nextPoolId = await contract.methods.nextPoolId().call();
      console.log(`Next Pool ID: ${nextPoolId}`);

      if (selectedBet.id >= nextPoolId) {
        console.error("Pool ID out of range:", selectedBet.id);
        alert("The selected pool is invalid or has already been closed.");
        return;
      }

    
      console.log("Estimating gas...");
      const gasEstimate = await contract.methods.placeBet(selectedBet.id, betOption === 'Yes').estimateGas({
        from: account,
        value: amountInWei.toString()
      });
      console.log(`Estimated gas: ${gasEstimate}`);

      console.log("Sending transaction...");
      const result = await contract.methods.placeBet(selectedBet.id, betOption === 'Yes').send({
        from: account,
        value: amountInWei.toString(),
        gas: BigInt(Math.floor(Number(gasEstimate) * 1.2)).toString()
      });
      console.log("Transaction result:", result);

      alert("You've successfully placed a bet.")

      setBets(prevBets => 
        prevBets.map(bet => 
          bet.id === selectedBet.id
            ? {
                ...bet,
                volume: bet.volume + amountInWei,
                participants: BigInt(bet.participants) + BigInt(1),
                yesProb: betOption === 'Yes' 
                  ? (bet.yesProb * Number(bet.participants) + 1) / (Number(bet.participants) + 1) 
                  : (bet.yesProb * Number(bet.participants)) / (Number(bet.participants) + 1),
                noProb: betOption === 'No' 
                  ? (bet.noProb * Number(bet.participants) + 1) / (Number(bet.participants) + 1) 
                  : (bet.noProb * Number(bet.participants)) / (Number(bet.participants) + 1),
              }
            : bet
        )
      )
      
      setSelectedBet(null)
      setBetAmount('')
      setBetOption('Yes')
    } catch (error) {
      console.error("Failed to place bet:", error);
      if (error) {
        console.error("Error message:", error);
      }
      alert("Failed to place your bet. Please check the console for more details.")
    }
  }

  const toggleFavorite = (id: number) => {
    setBets(prevBets =>
      prevBets.map(bet =>
        bet.id === id ? { ...bet, favorite: !bet.favorite } : bet
      )
    )
  }

  const checkContractState = async () => {
    if (!web3 || !contract) {
      console.error("Web3 or contract not initialized");
      return;
    }
    try {
      const owner = await contract.methods.owner().call();
      console.log("Contract owner:", owner);
      const betCount = await contract.methods.betCount().call();
      console.log("Total bets placed:", betCount);
    } catch (error) {
      console.error("Error checking contract state:", error);
    }
  }

  const filteredBets = bets
    .filter(bet =>
      (selectedCategory === 'All' || bet.category === selectedCategory) &&
      bet.question.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'volume') return Number(b.volume - a.volume)
      if (sortBy === 'participants') return Number(b.participants - a.participants)
      return 0
    })

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="container mx-auto px-4 py-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Bet On All</h1>
          <nav className="flex items-center space-x-4">
            <Tabs defaultValue="markets">
              <TabsList>
                <TabsTrigger value="markets">Markets</TabsTrigger>
                <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
              </TabsList>
            </Tabs>
            <Button variant="outline" size="sm"><Bell className="h-4 w-4" /></Button>
            <Button onClick={checkContractState}>Check Contract</Button>
            {!account ? (
              <Button onClick={connectWallet}>Connect Wallet</Button>
            ) : (
              <div className="flex items-center space-x-2">
                <Button variant="outline">{account.slice(0, 6)}...{account.slice(-4)}</Button>
                <Button variant="destructive" onClick={disconnectWallet}>Disconnect</Button>
              </div>
            )}
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <section className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <Input
              type="search"
              placeholder="Search markets..."
              className="max-w-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="flex space-x-2">
              {['All', ...categories.map(c => c.name)].map(cat => (
                <Button
                  key={cat}
                  variant={selectedCategory === cat ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex justify-end mb-4">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="volume">Volume</SelectItem>
                <SelectItem value="participants">Participants</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBets.map(bet => (
              <Card key={bet.id}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold">{bet.question}</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleFavorite(bet.id)}
                    >
                      <Star className={bet.favorite ? "fill-yellow-400" : ""} />
                    </Button>
                  </div>
                  <div className="text-sm text-gray-500">
                    {bet.volume.toString()} wei • {bet.participants.toString()} participants
                  </div>
                  <div className="flex justify-between space-x-4 mb-4">
                    <Button
                      className="flex-1 bg-green-500 hover:bg-green-600"
                      onClick={() => setSelectedBet(bet)}
                    >
                      Yes ({(bet.yesProb * 100).toFixed(1)}%)
                      {bet.yesProb > 0.5 && <ArrowUp className="ml-1 h-4 w-4" />}
                    </Button>
                    <Button
                      className="flex-1 bg-red-500 hover:bg-red-600"
                      onClick={() => setSelectedBet(bet)}
                    >
                      No ({(bet.noProb * 100).toFixed(1)}%)
                      {bet.noProb > 0.5 && <ArrowUp className="ml-1 h-4 w-4" />}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </main>

      <Dialog open={!!selectedBet} onOpenChange={() => setSelectedBet(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Place a Bet</DialogTitle>
            <DialogDescription>
              {selectedBet?.question}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="bet-amount" className="text-right">
                Amount (wei)
              </label>
              <Input
                id="bet-amount"
                type="number"
                value={betAmount}
                onChange={(e) => setBetAmount(e.target.value)}
                className="col-span-3"
                min="1"
                step="1"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="bet-option" className="text-right">
                Option
              </label>
              <Select value={betOption} onValueChange={(value) => setBetOption(value as 'Yes' | 'No')}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select option" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Yes">Yes</SelectItem>
                  <SelectItem value="No">No</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" onClick={placeBet} disabled={!account}>
              {account ? "Place Bet" : "Connect Wallet to Bet"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
