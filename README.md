# Cross chain Staking Pools


## Why Shuttle System?

Ethereum mainnet gas is costly for users who want to stake small number of matic tokens. Shuttle system allows users to stake Matic token on Polygon chain and claim stMatic token once shuttle is processed. Shuttle System works on top of Lido Liquid Staking, however this protocol is generic and can be extended to other liquid staking solution.s 

## Shuttle Lifecycle 

![image](https://user-images.githubusercontent.com/85118498/170120439-07275856-f5fa-45e5-9889-3ff3d4a4a1ad.png)


## Deployment steps 

1. Deploy Tunnels: 

```
npm run deploy-tunnel-goerli
npm run deploy-tunnel-mumbai
```
2. Set FxRoot on Child Tunnel and FxChild on RootTunnel 
3. Deploy fundCollector 
4. Deploy pool, make sure to use key with same nonce. Both the pool should have same address. 
   
   ```
   npm run deploy-pool-goerli
   npm run deploy-pool-mumbai
   ```

5. Set RootPool address on rootTunnel 
6. Set ChildPool address on childTunnel. 
7. Set Pool address at FundCollector   
8. Whilelist Operator




## Contract Addresses 

   ### Mainnet Contract Addresses
   [Ethereum Mainnet Contract](https://github.com/stakeall/cross-chain-staking-shuttle/blob/develop/scripts/address.js#L2) 

   [Polygon Mainnet Contract](https://github.com/stakeall/cross-chain-staking-shuttle/blob/develop/scripts/address.js#L28)  

   ### Testnet Contract Addresses 
   [Goerli Testnet Contract](https://github.com/stakeall/cross-chain-staking-shuttle/blob/develop/scripts/address.js#L15) 

   [Mumbai Testnet Contract](https://github.com/stakeall/cross-chain-staking-shuttle/blob/develop/scripts/address.js#L40)  
   
