const addresses = {
  1: {
    checkPointManager: "0x86E4Dc95c7FBdBf52e33D563BbDB00823894C287",
    fxRoot: "0xfe5e5D361b2ad62c541bAb87C45a0B9B018389a2",
    rootTunnel: "0xc36B5A0584C23081Cb7aE57401282a2926CE1182",
    withdrawManagerProxy: "0x2A88696e0fFA76bAA1338F2C74497cC013495922",
    erc20PredicateBurnOnly: "0x158d5fa3ef8e4dda8a5367decf76b94e7effce95",
    depositManagerProxy: "0x401F6c983eA34274ec46f84D70b31C151321188b",
    poLidoAdapter: "0x84100E5d1A6A50f1586338fdb1b52c78dC8C65eE",
    maticToken: "0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0",
    childPoolFundCollector: "0xf4a60ee2970b8f0457e7b819139cf4d9736c7443",
    rootPoolOwner: "0x8bA3f40ad569c3266D427Ae6eDE43b2A31f25E86",
    rootPoolProxy: "0x1E78e334B1730605438Bf8018A538E09d688C13E",
  },
  5: {
    checkPointManager: "0x2890bA17EfE978480615e330ecB65333b880928e",
    fxRoot: "0x3d1d3E34f7fB6D26245E6640E1c50710eFFf15bA",
    rootTunnel: "0x116f7C5b58cd10340B1ab8250949C9f4b8Ca54Ce", // v2
    withdrawManagerProxy: "0x2923C8dD6Cdf6b2507ef91de74F1d5E0F11Eac53",
    erc20PredicateBurnOnly: "0xf213e8fF5d797ed2B052D3b96C11ac71dB358027",
    depositManagerProxy: "0x7850ec290A2e2F40B82Ed962eaf30591bb5f5C96",
    poLidoAdapter: "0xFC4795d0CEd4B027B7FbbF9929F31fC871Ad3478", // v2
    maticToken: "0x499d11e0b6eac7c0593d8fb292dcbbf815fb29ae",
    childPoolFundCollector: "0x253a0b47bf8e82C540903d240C1E4113F303D230",
    rootPoolOwner: "0x0C170Dc2D2537FaDFdB2b374c3141bBb4ADDb1f7",
    rootPoolProxy: "0x0ad622a3631f51B884757b6Ea0Ec27a729d22C00", // v2
    // v1 rootTunnel: "0x9c7f7b6Bbb19876DA2767F86Eb2f280e96318EdA",
    // v1 poLidoAdapter: "0xf8bb8087F9967Edf6B0D26D146fA978A953EC2A5",
    // v1 childPoolFundCollector: "0x346EdB63a433405fc4411462a86acEa25fDeef80",
    // v1 rootPoolProxy: "0x307DdD8c382B92c81a1a1750C47D8Aa84b774Cf5",
  },
  137: {
    fxChild: "0x8397259c983751DAf40400790063935a11afa28a",
    childTunnel: "0xc36b5a0584c23081cb7ae57401282a2926ce1182",
    maticTokenOnChild: "0x0000000000000000000000000000000000001010",
    fundCollector: "0xf4a60ee2970b8f0457e7b819139cf4d9736c7443",
    stMaticToken: "0x3A58a54C066FdC0f2D55FC9C89F0415C92eBf3C4",
    fee: 50,
    shuttleExpiry: 302400,
    feeBeneficiary: "0x8bA3f40ad569c3266D427Ae6eDE43b2A31f25E86",
    childPoolOwner: "0x8bA3f40ad569c3266D427Ae6eDE43b2A31f25E86",
    childPoolProxy: "0x1E78e334B1730605438Bf8018A538E09d688C13E",
  },
  80001: {
    fxChild: "0xCf73231F28B7331BBe3124B907840A94851f9f11",
    childTunnel: "0x28347DEC3770c244d440Ba3e87Cd53fC0E7FC86C", // v2
    maticTokenOnChild: "0x0000000000000000000000000000000000001010",
    stMaticToken: "0xa337f0B897a874DE1E9F75944629a03F911cFbE8",
    fundCollector: "0x253a0b47bf8e82C540903d240C1E4113F303D230", // v2
    fee: 500,
    shuttleExpiry: 10,
    feeBeneficiary: "0x0C170Dc2D2537FaDFdB2b374c3141bBb4ADDb1f7",
    childPoolOwner: "0x0C170Dc2D2537FaDFdB2b374c3141bBb4ADDb1f7",
    childPoolProxy: "0x0ad622a3631f51B884757b6Ea0Ec27a729d22C00", // v2
    // v1 childTunnel: "0x55Cc891d4B2BBc6ea70CDBF874c549641A5D3194",
    // v1 childPoolProxy: "0x307DdD8c382B92c81a1a1750C47D8Aa84b774Cf5",
    // v1 fundCollector: "0x346EdB63a433405fc4411462a86acEa25fDeef80",
  },
};

module.exports = addresses;
