pragma solidity ^ 0.4.8;

/*
 * DaoCasino Random-contract factory
 * included referal system and erc20 for BET tokens
 */

contract ERC20 {
	function balanceOf(address _addr) returns(uint);

	function transfer(address _to, uint256 _value);

	function transferFrom(address _from, address _to, uint256 _value) returns(bool success);
}


contract Referral {
	function getAdviser(address _player) constant returns(address);

	function getOperator(address _player) constant returns(address);

	function upProfit(address _adviser, uint _profitAdviser, address _operator, uint _profitOperator);
}


contract owned {
	address public owner;

	function owned() {
		owner = msg.sender;
	}

	modifier onlyOwner {
		if (msg.sender != owner) throw;
		_;
	}

	function transferOwnership(address newOwner) onlyOwner {
		owner = newOwner;
	}
}


contract DaoCasinoRandom is owned {

	function DaoCasinoRandom(address newOwner) {
		transferOwnership(newOwner);
	}

	// Contract meta-information
	uint   public meta_version = 1;
	string public meta_code    = 'dc_random_v1';
	string public meta_name    = 'DaoCasinoRandom';
	string public meta_link    = 'https://github.com/DaoCasino';

	// PUT your ETH address
	address public gameDeveloper = 0x28eA054CB54228A82684fd452A3d1d801C15350e;

	uint public houseEdge = 2;


	address public addr_erc20 = 0x95a48dca999c89e4e284930d9b9af973a7481287;
	address public addr_ref   = 0xe195eed0e77b48146aa246dadf987d2504ac88cb;
	ERC20 erc                 = ERC20(addr_erc20);
	Referral ref              = Referral(addr_ref);

	bool public ownerStoped    = false;
	uint public minBet         = 100000;
	uint public maxBet         = 1000000000;
	uint public countRolls     = 0;
	uint public totalEthSended = 0;
	uint public totalEthPaid   = 0;

	/**
	 * @dev List of used random numbers
	 */
	enum GameState {
		InProgress,
		PlayerWon,
		PlayerLose
	}


	struct Game {
		address   player;
		uint      bet;
		uint      chance;
		bytes32   seed;
		GameState state;
		uint      payout;
		bool      up;
		uint      rnd;
		uint      min;
		uint      max;
	}
	event logRoll(Game game);

	mapping(bytes32 => Game) public listGames;

	modifier stoped() {
		if (ownerStoped == true) {
			throw;
		}
		_;
	}


	// Return funds to bankroller(owner)
	function withdraw(uint _bet) public onlyOwner {
		erc.transfer(msg.sender, _bet);
	}

	function Stop() public onlyOwner {
		if (ownerStoped == false) {
			ownerStoped = true;
		} else {
			ownerStoped = false;
		}
	}


	function getBank() public constant returns(uint) {
		return erc.balanceOf(this);
	}


	// Starts a new game
	function roll(uint bet, uint chance, bytes32 seed, bool up, uint256 min, uint256 max) public
	stoped {
		uint minmax = (max - min) + min;

		if (min > max || min == max) {
			throw; // incorrect bet
		}
		if (bet < minBet || bet > maxBet) {
			throw; // incorrect bet
		}
		if (chance > minmax - minmax/5000 || chance == 0) {
			throw; // incorrect bet
		}
		if (listGames[seed].rnd!=0) {
			throw; // used random
		}


		uint payout = bet * (minmax - minmax/5000) / chance;

		// Limitation of payment 1/10BR
		if ((payout - bet) > getBank() / 10) {
			throw;
		}

		if (!erc.transferFrom(msg.sender, this, bet)) {
			throw;
		}

		listGames[seed] = Game({
			player : msg.sender,
			bet    : bet,
			chance : chance,
			seed   : seed,
			state  : GameState.InProgress,
			payout : payout,
			up     : up,
			rnd    : 0,
			min    : min,
			max    : max,
		});


		logRoll( listGames[seed] );
	}

	// Bankroller confirm game
	function confirm(bytes32 random_id, uint8 _v, bytes32 _r, bytes32 _s) public onlyOwner {
		if (listGames[random_id].state == GameState.PlayerWon ||
			listGames[random_id].state == GameState.PlayerLose) {
			throw;
		}

		// is owner?
		if (ecrecover(random_id, _v, _r, _s) != owner) {
			throw
		}

		Game game = listGames[random_id];

		uint minmax = (game.max - game.min) + game.min;

		game.rnd = uint256(sha3(_s)) % minmax + game.min;

		countRolls++;
		totalEthPaid += game.bet;

		// WIN
		if((game.up && game.rnd > game.chance) || (!game.up && game.rnd < game.chance)){
			listGames[random_id].state = GameState.PlayerLose;

		// LOOSE
		} else {
			listGames[random_id].state = GameState.PlayerWon;

			erc.transfer(game.player, game.payout);

			totalEthSended += game.payout;
		}

		serviceReward(game.player, game.bet);
	}

	// Get game result
	function getRollResult(bytes32 random_id) public constant returns(GameState) {
		Game memory game = listGames[random_id];

		// game doesn't exist
		if (game.player == 0) {
			throw;
		}

		return game.state;
	}


	function serviceReward(address _player, uint256 _value) internal {
		var profit = _value * houseEdge / 100;
		var reward = profit * 25 / 100;

		var operator = ref.getOperator(_player);
		var adviser  = ref.getAdviser(_player);

		ref.upProfit(adviser, reward, operator, reward);

		erc.transfer(gameDeveloper, reward);
		erc.transfer(operator,      reward);
		erc.transfer(adviser,       reward);
	}

}
