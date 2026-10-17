import {MainnetRiskNotice} from './MainnetRiskNotice'
import {CHOG_GENESIS} from './contracts'
import {mainnetDeployment, mainnetDeploymentReceipt, validMainnetDeployment} from './mainnetDeployment'

export function GameContractInfo() {
  const verified = validMainnetDeployment(mainnetDeployment) ? mainnetDeployment : null
  return <section aria-labelledby="game-contract-title">
    <h3 id="game-contract-title">Game contract information</h3>
    <p>On-chain gameplay not yet enabled. Verified Monad mainnet reads only.</p>
    <dl className="settings-info">
      <div><dt>Network</dt><dd>Monad mainnet · chain 143</dd></div>
      <div><dt>Chog Genesis NFT collection</dt><dd className="survivor-address">{CHOG_GENESIS}</dd></div>
      <div><dt>Chog Survivor game contract</dt><dd>{verified ? <a className="survivor-address" href={`https://monadscan.com/address/${verified.address}#code`} target="_blank" rel="noopener noreferrer">{verified.address} · MonadScan deployment record and verified source</a> : 'Pending deployment and verification — no game address published'}</dd></div>
      <div><dt>Deployment transaction</dt><dd>{verified && mainnetDeploymentReceipt ? <a href={mainnetDeploymentReceipt.monadScanUrl} target="_blank" rel="noopener noreferrer">{mainnetDeploymentReceipt.transactionHash}</a> : 'Pending — no deployment transaction published'}</dd></div>
      {!verified && <div><dt>Deployment block / MonadScan game link</dt><dd>Pending finalized deployment and verification</dd></div>}
      {verified && <><div><dt>Deployment block</dt><dd>{verified.deploymentBlock.toString()}</dd></div><div><dt>Runtime Keccak-256</dt><dd className="survivor-address">{verified.runtimeCodeHash}</dd></div></>}
    </dl>
    <p>Runtime verified against the frozen artifact. Source verified on MonadScan (Exact Match); deployment remains unaudited.</p>
    {verified && <MainnetRiskNotice/>}
    <p>Genuine holders keep their NFT in its current wallet. Gameplay requires no NFT transfer, staking or approval. One action per token per UTC day; browsing is available without a wallet. No survivor data is fabricated for visitors.</p>
  </section>
}
