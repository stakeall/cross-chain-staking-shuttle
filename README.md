# Cross chain Staking Pools


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