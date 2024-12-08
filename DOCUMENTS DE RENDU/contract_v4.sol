// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract BettingContract {
    struct Bet {
        address user;
        uint256 amount; // Montant misé
        bool prediction; // Prédiction : true = "Oui", false = "Non"
    }

    struct Pool {
        uint256 totalAmount; // Montant total dans le pool
        uint256 totalWinningAmount; // Montant total des paris gagnants
        bool resolved; // Si le pari est résolu
        bool outcome; // Résultat du pari (true = "Oui", false = "Non")
        Bet[] bets; // Liste des paris dans le pool
    }

    mapping(uint256 => Pool) public pools; // Mapping des pools par leur ID
    uint256 public nextPoolId; // ID du prochain pool

    // Événements
    event PoolCreated(uint256 poolId);
    event BetPlaced(uint256 poolId, address indexed user, uint256 amount, bool prediction);
    event PoolResolved(uint256 poolId, bool outcome);

    // Créer un nouveau pool
    function createPool() public returns (uint256) {
        uint256 poolId = nextPoolId;
        pools[poolId].resolved = false;
        nextPoolId++;
        emit PoolCreated(poolId);
        return poolId;
    }

    // Placer un pari dans un pool
    function placeBet(uint256 poolId, bool _prediction) public payable {
        require(msg.value > 0, "Le montant du pari doit etre superieur a 0");
        require(poolId < nextPoolId, "Pool invalide");
        Pool storage pool = pools[poolId];
        require(!pool.resolved, "Le pool a deja ete resolu");

        // Ajouter le pari au pool
        pool.bets.push(Bet({
            user: msg.sender,
            amount: msg.value,
            prediction: _prediction
        }));

        // Ajouter au montant total du pool
        pool.totalAmount += msg.value;

        emit BetPlaced(poolId, msg.sender, msg.value, _prediction);
    }

    // Résoudre un pool
    function resolvePool(uint256 poolId, bool outcome) public {
        require(poolId < nextPoolId, "Pool invalide");
        Pool storage pool = pools[poolId];
        require(!pool.resolved, "Le pool a deja ete resolu");

        pool.resolved = true;
        pool.outcome = outcome;

        // Calculer le montant total des mises gagnantes
        for (uint256 i = 0; i < pool.bets.length; i++) {
            if (pool.bets[i].prediction == outcome) {
                pool.totalWinningAmount += pool.bets[i].amount;
            }
        }

        // Redistribuer les gains aux gagnants
        for (uint256 i = 0; i < pool.bets.length; i++) {
            if (pool.bets[i].prediction == outcome) {
                uint256 winnings = (pool.bets[i].amount * pool.totalAmount) / pool.totalWinningAmount;
                payable(pool.bets[i].user).transfer(winnings);
            }
        }

        emit PoolResolved(poolId, outcome);
    }

    // Récupérer les détails d'un pool
    function getPool(uint256 poolId) public view returns (
        uint256 totalAmount,
        uint256 totalWinningAmount,
        bool resolved,
        bool outcome,
        uint256 totalBets
    ) {
        require(poolId < nextPoolId, "Pool invalide");
        Pool storage pool = pools[poolId];
        return (
            pool.totalAmount,
            pool.totalWinningAmount,
            pool.resolved,
            pool.outcome,
            pool.bets.length
        );
    }

    // Récupérer les détails d'un pari dans un pool
    function getBet(uint256 poolId, uint256 betIndex) public view returns (
        address user,
        uint256 amount,
        bool prediction
    ) {
        require(poolId < nextPoolId, "Pool invalide");
        Pool storage pool = pools[poolId];
        require(betIndex < pool.bets.length, "Pari invalide");

        Bet storage bet = pool.bets[betIndex];
        return (bet.user, bet.amount, bet.prediction);
    }
}