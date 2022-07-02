import { SigningStargateClient, StargateClient, IndexedTx } from "@cosmjs/stargate"
import { Tx } from "cosmjs-types/cosmos/tx/v1beta1/tx"
import { MsgSend } from "cosmjs-types/cosmos/bank/v1beta1/tx"
import { DirectSecp256k1HdWallet, OfflineDirectSigner } from "@cosmjs/proto-signing"

import { readFile } from "fs/promises"

const rpc = "https://rpc.sentry-01.theta-testnet.polypore.xyz"

const runAll = async (): Promise<void> => {
  const getClyneSignerFromMnemonic = async (): Promise<OfflineDirectSigner> => {
    return DirectSecp256k1HdWallet.fromMnemonic((await readFile("./testnet.clyne.mnemonic.key")).toString(), {
        prefix: "cosmos",
    })
  }
  
  const clyneSigner: OfflineDirectSigner = await getClyneSignerFromMnemonic()

  const client = await StargateClient.connect(rpc)
  console.log("With client, chain id:", await client.getChainId(), ", height:", await client.getHeight())
  console.log(
    "Current Clyne balances:",
    await client.getAllBalances("cosmos1vjw3gmmyh5ajc2lgg9tgc88svavncpw2fl9usd"),
  )

  const faucetTx: IndexedTx = (await client.getTx(
    "EC5B9A5E115C620DDB24206155728DD33936AA84917BF806AF2DD3423328EB52",
  ))!

  console.log('--------------------------')
  // const rawLog = JSON.parse(faucetTx.rawLog)
  // console.log("Raw log:", JSON.stringify(rawLog, null, 4))
  // const faucetInRaw: string = rawLog[0].events
  //   .find((eventEl: any) => eventEl.type === "coin_spent")
  //   .attributes.find((attribute: any) => attribute.key === "spender").value

  // console.log('faucetInRaw', faucetInRaw)
  // console.log("Faucet in Raw balances:", await client.getAllBalances(faucetInRaw))

  console.log('--------------------------')

  console.log("Faucet Tx:", faucetTx)

  const decodedTx: Tx = Tx.decode(faucetTx.tx)
  console.log("DecodedTx:", decodedTx)

  console.log("Decoded messages:", decodedTx.body!.messages)
  console.log("Gas fee:", decodedTx.authInfo!.fee!.amount)
  console.log("Gas limit:", decodedTx.authInfo!.fee!.gasLimit.toString(10))

  const sendMessage: MsgSend = MsgSend.decode(decodedTx.body!.messages[0].value)
  console.log("Sent message:", sendMessage)

  const faucet: string = sendMessage.fromAddress

  console.log("Faucet balances:", await client.getAllBalances(faucet))

  const clyne = (await clyneSigner.getAccounts())[0].address
  console.log("Clyne's address from signer", clyne)

  const signingClient = await SigningStargateClient.connectWithSigner(rpc, clyneSigner)

  console.log(
    "With signing client, chain id:",
    await signingClient.getChainId(),
    ", height:",
    await signingClient.getHeight()
)
}

runAll()