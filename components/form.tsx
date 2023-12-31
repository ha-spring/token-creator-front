"use client";

import {
  ConnectWallet,
  useAddress,
  useNetwork,
  useSigner,
} from "@thirdweb-dev/react";
import { useState, useEffect } from "react";
import { ContractFactory } from "ethers";
import styled from "styled-components";

const INITIAL_STATE = {
  tokenName: "",
  symbol: "",
  initialSupply: "",
  mintable: false,
  burnable: false,
  pausable: false,
};

export default function Form() {
  const address = useAddress();
  const signer = useSigner();
  const [{ data, error, loading }, switchNetwork] = useNetwork();

  useEffect(() => {
    if (data.chain === undefined) {
      return;
    }
    if ([80001, 137, 1, 84531].includes(data?.chain?.chainId as number)) {
      setNetworkError(false);
    } else {
      setNetworkError(true);
    }
  }, [data]);

  const [tokenName, setTokenName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [initialSupply, setInitialSupply] = useState("");
  const [mintable, setMintable] = useState(false);
  const [burnable, setBurnable] = useState(false);
  const [pausable, setPausable] = useState(false);
  const [tokenNameError, setTokenNameError] = useState("");
  const [symbolError, setSymbolError] = useState("");
  const [initialSupplyError, setInitialSupplyError] = useState("");
  const [addressError, setAddressError] = useState("");
  const [currentNetwork, setCurrentNetwork] = useState("");
  const [txInProgress, setTxInProgress] = useState(false);
  const [contractAddress, setContractAddress] = useState("");
  const [networkError, setNetworkError] = useState(false);
  const [createTokenInProgress, setCreateTokenInProgress] = useState(false);

  const createToken = async () => {
    setCreateTokenInProgress(true);
    // Reset previous error messages
    setTokenNameError("");
    setSymbolError("");
    setInitialSupplyError("");
    setAddressError("");

    let hasErrors = false;

    if (tokenName === "") {
      setTokenNameError("Token name is required.");
      hasErrors = true;
    }
    if (symbol === "") {
      setSymbolError("Symbol is required.");
      hasErrors = true;
    }
    if (initialSupply === "") {
      setInitialSupplyError("Initial supply is required.");
      hasErrors = true;
    }
    if (!address) {
      setAddressError("Please connect your wallet.");
      hasErrors = true;
    }

    if (hasErrors || networkError) {
      setCreateTokenInProgress(false);
      return;
    }

    //const res = await fetch("http://localhost:3000/contract", {
    const res = await fetch("/contract", {
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
      body: JSON.stringify({
        name: tokenName,
        symbol,
        initialSupply,
        isMintable: mintable,
        isBurnable: burnable,
        isPausable: pausable,
      }),
    });
    const data = await res.json();
    const factory = new ContractFactory(data.abi, data.bytecode, signer);
    try {
      const contract = await factory.deploy();
      setTxInProgress(true);
      await contract.deployTransaction.wait();
      setTxInProgress(false);
      setContractAddress(contract.address);
    } catch {
      setCreateTokenInProgress(false);
      return;
    }

    setTokenName(INITIAL_STATE.tokenName);
    setSymbol(INITIAL_STATE.symbol);
    setInitialSupply(INITIAL_STATE.initialSupply);
    setMintable(INITIAL_STATE.mintable);
    setBurnable(INITIAL_STATE.burnable);
    setPausable(INITIAL_STATE.pausable);
    setCreateTokenInProgress(false);
  };

  const handleTokenNameChange = (e: any) => {
    setTokenName(e.target.value);
    setTokenNameError("");
  };

  const handleSymbolChange = (e: any) => {
    setSymbol(e.target.value);
    setSymbolError("");
  };

  const handleInitialSupplyChange = (e: any) => {
    setInitialSupply(e.target.value);
    setInitialSupplyError("");
  };

  if (txInProgress) return <Label>Transaction in progress...</Label>;
  else
    return (
      <>
        {contractAddress !== "" && (
          <Label>Contract Address: {contractAddress}</Label>
        )}
        {networkError && (
          <ErrorMessageXL>
            Unsupported network. Please switch to Polygon or Ethereum.
          </ErrorMessageXL>
        )}
        <Row>
          <Column>
            <InputContainer>
              <Label>Token name</Label>
              <Input
                placeholder="e.g. My Token Name"
                value={tokenName}
                onChange={handleTokenNameChange}
              />
              {tokenNameError && <ErrorMessage>{tokenNameError}</ErrorMessage>}
            </InputContainer>
            <InputContainer>
              <Label>Symbol</Label>
              <Input
                placeholder="e.g. SYM"
                value={symbol}
                onChange={handleSymbolChange}
              />
              {symbolError && <ErrorMessage>{symbolError}</ErrorMessage>}
            </InputContainer>
            <InputContainer>
              <Label>Initial supply</Label>
              <Input
                type="number"
                min="0"
                placeholder="e.g. 123456789"
                value={initialSupply}
                onChange={handleInitialSupplyChange}
              />
              {initialSupplyError && (
                <ErrorMessage>{initialSupplyError}</ErrorMessage>
              )}
            </InputContainer>
            <InputContainer>
              <Label>
                <Checkbox
                  id="mintable"
                  checked={mintable}
                  onChange={() => setMintable(!mintable)}
                />
                Mintable
              </Label>
            </InputContainer>
            <InputContainer>
              <Label>
                <Checkbox
                  id="burnable"
                  checked={burnable}
                  onChange={() => setBurnable(!burnable)}
                />
                Burnable
              </Label>
            </InputContainer>
            <InputContainer>
              <Label>
                <Checkbox
                  id="pausable"
                  checked={pausable}
                  onChange={() => setPausable(!pausable)}
                />
                Pausable
              </Label>
            </InputContainer>
          </Column>
          <Column></Column>
        </Row>
        <Button onClick={createToken}>
          {createTokenInProgress ? "In progress..." : "Create Token"}
        </Button>
        <div>{addressError && <ErrorMessage>{addressError}</ErrorMessage>}</div>
      </>
    );
}

const Row = styled.div`
  display: flex;
  gap: 20px;
  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const Column = styled.div`
  flex: 1;
`;

const InputContainer = styled.div`
  padding: 10px 0px;
`;

const Input = styled.input`
  padding: 1em;
  border: 0.5px lightgray solid;
  border-radius: 5px;
  width: 100%;
  font-size: 1em;
`;

const Label = styled.div`
  width: 100%;
  font-size: 1.5em;
  margin-bottom: 5px;
  color: darkgrey;
`;

const Button = styled.button`
  font-size: 1.5em;
  padding: 10px 40px;
  background: darkgrey;
  color: white;
  border: none;
  border-radius: 5px;
  margin-top: 10px;
  cursor: pointer;
`;

const Checkbox = styled.input.attrs({ type: "checkbox" })`
  font-size: 1.5em;
  margin: 0;
  margin-right: 5px;
  hieght: 20px;
  width: 20px;
`;

const ErrorMessage = styled.span`
  color: red;
  font-size: 12px;
  margin-top: 5px;
`;

const ErrorMessageXL = styled.div`
  width: 100%;
  font-size: 1.5em;
  margin-bottom: 5px;
  color: red;
`;
