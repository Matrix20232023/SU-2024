// Copyright (c) Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

import { MiniNFT } from './MiniNFT';
import { SummaryCard } from './SummaryCard';
import AccountAddress from '_components/account-address';
import ExplorerLink from '_components/explorer-link';
import { ExplorerLinkType } from '_components/explorer-link/ExplorerLinkType';
import ExternalLink from '_components/external-link';
import {
    useMiddleEllipsis,
    useFormatCoin,
    useGetNFTMeta,
    useAppSelector,
    useGetRequestTxnMeta,
} from '_hooks';
import { GAS_TYPE_ARG } from '_redux/slices/sui-objects/Coin';

import type { SignableTransaction, Base64DataBuffer } from '@mysten/sui.js';
import type { TransactionRequest } from '_payloads/transactions';
import type { CoinsMetaProps } from '_redux/slices/transaction-requests';

import st from './DappTxApprovalPage.module.scss';

const TRUNCATE_MAX_LENGTH = 10;
const TRUNCATE_PREFIX_LENGTH = 6;

type TransferSummerCardProps = {
    coinsMeta: CoinsMetaProps[];
    origin: string;
    objectIDs: string[];
    gasEstimate: number | null;
};

function MiniNFTLink({ id }: { id: string }) {
    const objectId = useMiddleEllipsis(
        id,
        TRUNCATE_MAX_LENGTH,
        TRUNCATE_PREFIX_LENGTH
    );
    const nftMeta = useGetNFTMeta(id);
    return (
        <>
            {nftMeta && (
                <MiniNFT
                    url={nftMeta.url}
                    name={nftMeta?.name || 'NFT Image'}
                    size="xs"
                />
            )}
            <ExplorerLink
                type={ExplorerLinkType.object}
                objectID={id}
                className={st.objectId}
                showIcon={false}
            >
                {objectId}
            </ExplorerLink>
        </>
    );
}

function CoinMeta({
    receiverAddress,
    coinMeta,
    origin,
}: {
    receiverAddress: string;
    coinMeta: CoinsMetaProps;
    origin: string;
}) {
    const [formattedAmount, symbol] = useFormatCoin(
        coinMeta.amount ? Math.abs(coinMeta.amount) : 0,
        coinMeta.coinType
    );

    const activeAccount = useAppSelector(({ account }) => account.address);

    const useOrigin = receiverAddress === activeAccount;

    const receiverAddr = useMiddleEllipsis(
        receiverAddress,
        TRUNCATE_MAX_LENGTH,
        TRUNCATE_PREFIX_LENGTH
    );

    /// A net positive amount means the user received coins and verse versa.
    const sendLabel = coinMeta.amount < 0 ? 'Send' : 'Receive';
    const receiveLabel = coinMeta.amount < 0 ? 'To' : 'From';

    // Use origin if current user address is the same as receiver address.

    return (
        <div className={st.content}>
            <div className={st.row}>
                <div className={st.label}>{sendLabel}</div>
                <div className={st.value}>
                    {formattedAmount} {symbol}
                </div>
            </div>

            <div className={st.row}>
                <div className={st.label}>{receiveLabel}</div>
                <div className={st.value}>
                    <div className={st.value}>
                        {useOrigin ? (
                            <ExternalLink
                                href={origin}
                                className={st.origin}
                                showIcon={false}
                            >
                                {new URL(origin).host}
                            </ExternalLink>
                        ) : (
                            <ExplorerLink
                                type={ExplorerLinkType.address}
                                address={receiverAddress}
                                className={st.objectId}
                                showIcon={false}
                            >
                                {receiverAddr}
                            </ExplorerLink>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function TransactionSummary({
    objectIDs,
    coinsMeta,
    gasEstimate,
    origin,
}: TransferSummerCardProps) {
    const [gasEst, gasSymbol] = useFormatCoin(gasEstimate || 0, GAS_TYPE_ARG);

    return (
        <SummaryCard header="Transaction summary">
            {coinsMeta &&
                coinsMeta.map((coinMeta) => (
                    <CoinMeta
                        receiverAddress={coinMeta.receiverAddress}
                        key={coinMeta.receiverAddress + coinMeta.coinType}
                        coinMeta={coinMeta}
                        origin={origin}
                    />
                ))}
            {objectIDs.length > 0 && (
                <div className={st.content}>
                    {objectIDs.map((objectId) => (
                        <div className={st.row} key={objectId}>
                            <div className={st.label}>Send</div>
                            <div className={st.value}>
                                <MiniNFTLink id={objectId} />
                            </div>
                        </div>
                    ))}

                    <div className={st.row}>
                        <div className={st.label}>To</div>
                        <div className={st.value}>
                            <AccountAddress
                                showLink={false}
                                copyable={false}
                                className={st.ownerAddress}
                                mode="normal"
                            />
                        </div>
                    </div>
                </div>
            )}

            <div className={st.cardFooter}>
                <div>Estimated Gas Fees</div>
                {gasEst} {gasSymbol}
            </div>
        </SummaryCard>
    );
}

export function TransactionSummaryCard({
    txRequest,
    address,
}: {
    txRequest: TransactionRequest;
    address: string;
}) {
    const txData =
        txRequest.tx.type === 'move-call'
            ? {
                  kind: 'moveCall',
                  data: txRequest.tx.data,
              }
            : txRequest.tx.data;

    const txReqData = {
        id: txRequest.id,
        txData: txData as string | SignableTransaction | Base64DataBuffer,
        activeAddress: address,
    };

    const txnMeta = useGetRequestTxnMeta(txReqData);

    const gasEstimation = txnMeta.txGasEstimation ?? null;
    const transactionSummary = txnMeta.txnMeta;

    if (!transactionSummary) {
        return null;
    }
    return (
        <TransactionSummary
            objectIDs={transactionSummary.objectIDs}
            coinsMeta={transactionSummary.coins}
            gasEstimate={gasEstimation}
            origin={txRequest.origin}
        />
    );
}