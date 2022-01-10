#! python3

# =================================================
# author: Gael Marcadet <gael.marcadet@limos.fr>
# description: Pre-computations file used to generate
#   rewards cumulated by each algorithm.
# =================================================
from abc import abstractmethod
from random import random, seed, randint, choices, getstate, shuffle, setstate, betavariate
from typing import AbstractSet, NoReturn
from math import sqrt, log, e, exp
import json
from os.path import join
import time
import os
from phe import paillier
from Crypto.Random import get_random_bytes
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

# =================================================
# This section contains the utils components used
# in the strategies (copied from samba repo)
# =================================================
class IsolatedRandomGenerator:
    """
    Random number generator able to produces random float and int, with respect to a given seed.
    """
    def __init__(self, seed):
        self.seed = seed

    def random(self, t) -> float:
        """Returns a random float between 0 and 1 includes given a time step."""
        seed(self.seed + t)
        value = random()

        return value

    def randint(self, t, min, max) -> int:
        """
        Returns a random int between min and max includes given a time step.
        """
        seed(self.seed + t)
        value = randint(min, max)
        return value

    def choice(self, items, weights, t):
        """Returns randomly a item contained in a given list of items, with a given probability weights."""
        seed(self.seed + t)
        value = choices( items, weights=weights, k=1 )[0]
        return value


class IsolatedBernoulliArm:
    """Simulates a bandit arm which returns a reward with a given probability, with respect to a reward seed."""
    def __init__(self, p, seed):
        self.p = p
        self.random_generator = IsolatedRandomGenerator(seed=seed)

    def pull(self, t) -> int:
        """Returns a reward 0 or 1 randomly with respect to a time step t."""
        random_value = self.random_generator.random(t)
        return 1 if random_value <= self.p else 0 

    def __str__(self):
        return str(self.p)


class ExecutionHistory:
    def __init__(self, probs: [float], budget: int) -> None:
        self.nb_arms = len(probs)
        self.probs = probs
        self.budget = budget
        self.execution_time = None
        self.initial_exploration = {
            "rewards": [],
            "pulls": [],
        }
        self.turns = []
        self.parameters = []
    
    def addParameter(self, name :str, value : float ):
        self.parameters.append({ "name": name, "value": value })

    def addExecutionTime( self, execution_time ):
        self.execution_time = execution_time

    def addInitialExploration( self, rewards : [int], pulls : [int] ):
        self.initial_exploration = {
            "rewards": rewards,
            "pulls": pulls
        }

    def add_data_by_turn( self, turn : int, scores : [float], selectedArm : int, reward : int, nbPulls : [int], nbRewards: [int] ):
        # compute the cumulative reward based on the previous turn
        if self.turns:
            cumulative_reward = self.turns[-1]["cumulative_reward"] + reward
        else:
            cumulative_reward = sum(self.initial_exploration["rewards"]) + reward

        self.turns.append({
            'turn': turn,
            'scores': scores,
            'selected_arm': selectedArm,
            'reward': reward,
            'cumulative_reward': cumulative_reward,
            'nb_rewards': nbRewards,
            'nb_pulls': nbPulls,
        })

    def export_as_dict( self ):
        return {
            'params': self.parameters,
            "nb_arms": self.nb_arms,
            "probs": self.probs,
            "budget": self.budget,
            "initial_exploration": self.initial_exploration,
            "turns": self.turns,
            "execution_time": {
                "time": self.execution_time,
                "budget": self.budget,
            },
        }

def argmax( values : [float] ) -> int:
    maxIndex = 0
    maxValue = values[maxIndex]
    for index, value in enumerate(values):
        if value > maxValue:
            maxIndex, maxValue = index, value
    return maxIndex

class IsolatedPermutation:
    """Permutation class allows to permute a list and to invert the permutation of a permuted list.

    This implementation has been designed to be controlled by a seed, useful to applied the same permutation
    over several algorithms.
    """

    @staticmethod
    def new(nb_items: int, perm_seed: int, turn: int):
        """Creates and returns an initialized permutation adapted to permute a list of a given size.

       Args:
           nb_items: Number of items in the list to permute or to invert.
           perm_seed: Permutation seed used to initialize the random state.
           turn: Integer used to create the same permutation at a given time step.
       """
        permutation = IsolatedPermutation(nb_items, perm_seed)
        permutation.reset(turn)
        return permutation

    def __init__(self, nb_items, perm_seed: int):
        self.nb_items = nb_items
        self.perm_seed = perm_seed

    def reset(self, turn: int):
        """Resets the permutation for a given time step."""
        permuted_index = [i for i in range(self.nb_items)]

        save_state = getstate()
        seed(self.perm_seed + turn)
        shuffle(permuted_index)
        setstate(save_state)

        self.__permutation = {index: perm for index, perm in enumerate(permuted_index)}
        self.__inverse = {perm: index for index, perm in enumerate(permuted_index)}

    def permute(self, values):
        """Returns the permuted list given in parameter.

        Args:
            values: List to be permuted.
        """
        if len(values) != self.nb_items:
            raise Exception("Cannot permutate list with a size different from {}".format(self.nb_items))

        permuted_values = [None for _ in range(self.nb_items)]
        for real_index, permuted_index in self.__permutation.items():
            permuted_values[permuted_index] = values[real_index]
        return permuted_values

    def invert_permutation(self, permuted_values):
        """Returns the permuted list where each item has been replaced to his original position.

        Args:
            permuted_values: Permuted list to be inverted.
        """
        if len(permuted_values) != self.nb_items:
            raise Exception("Cannot permutate list with a size different from {}".format(self.nb_items))

        values = [None for _ in range(self.nb_items)]
        for real_index, permuted_index in self.__permutation.items():
            values[real_index] = permuted_values[permuted_index]
        return values

    def invert_permuted_index(self, permuted_index):
        """Returns the original position of the given permuted index.

        Args:
            permuted_index: Permuted index.
        """
        return self.__inverse[permuted_index]

    def __str__(self):
        return str(
            "Permutation({} -> {}), Inverse({} -> {})".format(self.__permutation.keys(), self.__permutation.values(),
                                                              self.__inverse.keys(), self.__inverse.values()))


def randint_if_none( value : int ) -> int :
    if value == None:
        return randint()
    return value

def permute_and_max( l, perm_seed : int, turn : int, key = lambda x: x ):
    permutation = IsolatedPermutation.new(len(l), perm_seed, turn)
    permuted_l = permutation.permute(l)
    max_index = 0
    max_value = key(permuted_l[0])
    for i in range(1, len(permuted_l)):
        vi = key(permuted_l[i])
        if vi > max_value:
            max_index = i
            max_value = vi
    return permuted_l[max_index]


# =================================================
# This section contains the implementation of
# the strategies (copied from samba repo)
# =================================================

class StandardBanditsAlgorithm():
    def __init__(self, probs: [float], reward_seed = 123):
        self.K = len(probs)
        self.probs = probs
        self.arms = [ IsolatedBernoulliArm( p, reward_seed ) for p in probs ]
        self.pulls = [ 0 ] * self.K
        self.rewards = [ 0 ] * self.K


    
    def getParameters( self ): return []

    @abstractmethod
    def computeScore(self, turn : int, arm : int ) -> float: pass

    @abstractmethod
    def selectArm(self, turn : int, scores : [float]) -> int: pass

    def nbPull( self, arm : int  ) -> int:
        return self.pulls[arm]

    def nbRewards( self, arm : int ) -> int:
        return self.rewards[arm]

    def pullArm( self, turn : int, arm : int ) -> int:
        """Pulls an arm and updates local variables
        """
        reward = self.arms[arm].pull( turn )
        self.rewards[arm] += reward
        self.pulls[arm] += 1
        return reward

    def play( self, budget ) -> ExecutionHistory:
        # create the execution history returned at the end of the execution
        execution_history = ExecutionHistory( self.probs, budget )
        for name, value in self.getParameters():
            execution_history.addParameter( name, value )

        start = time.time()

        # do the initial exploration phase
        t = 1
        rewardsObtainedDuringExploration = []
        for arm in range(self.K):
            reward = self.pullArm(t, arm)
            rewardsObtainedDuringExploration.append( reward )
            t += 1
        execution_history.addInitialExploration( 
            rewards=rewardsObtainedDuringExploration,
            pulls=list(self.pulls)
            )

        # exploration
        while t <= budget:

            # compute scores and select the arm based on scores
            scores = [ self.computeScore( t, arm ) for arm in range(self.K) ]
            selectedArm = self.selectArm(t, scores)
            assert selectedArm is not None, 'Selected Arm must be an integer: not ' + str(selectedArm)

            # pull the arm in order to get an arm
            reward = self.pullArm( t, selectedArm )
            assert reward is not None, 'Reward must be an integer: not ' + str(reward)

            # insert the pulled arm and all data in the execution history
            execution_history.add_data_by_turn(
                turn=t,
                scores=scores,
                selectedArm=selectedArm,
                reward=reward,
                nbPulls=list(self.pulls),
                nbRewards=list(self.rewards)
            )

            t += 1

        end = time.time()
        execution_history.addExecutionTime( end - start )

        return execution_history



class Timer:
    """Timer class allows to time a arbitrary blocks of code by using "with" python statement.

    This object allows to time several not nested blocks of code as follows:

    timer = Timer()
    with timer:
        sleep(20)
    print("Execution time (s): {}".format(time.execution_time_in_seconds()))

    Warning: Current implementation of does not support nested blocks timing.
    In a such way, the timer will be reset each time the time is reused in a with statement.
    """
    def __init__(self):
        self.__total_execution_time : float = 0
        self.__running : bool = False
        self.__start : float = 0

    def __enter__(self):
        self.__has_start = True
        self.__start = time.time()

    def __exit__(self, exc_type, exc_val, exc_tb):
        end = time.time()
        self.__total_execution_time += end - self.__start

        self.__running = False
        self.__start = 0

    def execution_time_in_seconds(self) -> float:
        """Returns elapsed time in seconds.
        Returns:
            The elapsed time between the beginning and the end of the "with" block.
        """
        return self.__total_execution_time

class SambaTimer:
    def __init__(self, strategy : StandardBanditsAlgorithm):
        self.strategy = strategy
        probs, reward_seed = strategy.probs, strategy.arms[0].random_generator.seed
        self.K = len(probs)
        self.probs = probs
        self.arms = [ IsolatedBernoulliArm( p, reward_seed ) for p in probs ]
        self.pulls = strategy.pulls
        self.rewards = strategy.rewards

        self.comp_execution_time = Timer()
        self.controller_execution_time = Timer()
        self.customer_execution_time = Timer()
        self.nodes_execution_time = [ Timer() for _ in range(self.K) ]

    def nbPull( self, arm : int  ) -> int:
        return self.pulls[arm]

    def nbRewards( self, arm : int ) -> int:
        return self.rewards[arm]

    def pullArm( self, turn : int, arm : int ) -> int:
        """Pulls an arm and updates local variables
        """
        with self.nodes_execution_time[arm]:
            reward = self.arms[arm].pull( turn )
            self.rewards[arm] += reward
            self.pulls[arm] += 1
            return reward

    def time( self, budget ):

        # do the initial exploration phase
        t = 1
        for arm in range(self.K):
            reward = self.pullArm(t, arm)
            t += 1

        # exploration
        while t <= budget:

            # compute scores and select the arm based on scores
            scores = []
            for arm in range(self.K):
                with self.nodes_execution_time[arm]:
                    arm_score = self.strategy.computeScore( t, arm )
                scores.append(arm_score)
            
            # create the proxy realized by Samba
            with self.controller_execution_time:
                scores = scores

            with self.comp_execution_time:
                selectedArm = self.strategy.selectArm(t, scores)
            assert selectedArm is not None, 'Selected Arm must be an integer: not ' + str(selectedArm)

            # pull the arm in order to get an arm
            reward = self.pullArm( t, selectedArm )
            assert reward is not None, 'Reward must be an integer: not ' + str(reward)

            t += 1

        with self.controller_execution_time:
            cumulative_reward = sum(self.rewards)
        
        with self.customer_execution_time:
            cumulative_reward = cumulative_reward
            
        return {
            "comp": self.comp_execution_time.execution_time_in_seconds(),
            "controller": self.controller_execution_time.execution_time_in_seconds(),
            "customer": self.customer_execution_time.execution_time_in_seconds(),
            "arms": [ timer.execution_time_in_seconds() for timer in self.nodes_execution_time ]
        }
        

# -------------------------------------------------
# Epsilon-greedy implementation
# -------------------------------------------------
class EpsilonGreedyParameters:
    """
    Defines parameters related with the e-greedy bandit algorithm, and some parameters useful to
    control the randomness.
    """
    def __init__(self, epsilon, epsilon_seed, reward_seed, random_arm_seed):
        self.epsilon = epsilon
        self.epsilon_seed = epsilon_seed
        self.reward_seed = reward_seed
        self.random_arm_seed = random_arm_seed


class EpsilonGreedyBanditsAlgorithm(StandardBanditsAlgorithm):
    """Implementation of the e-greedy algorithm.
    It follows the standard defined in the paper "Algorithms for the multi-armed bandit problem"
    accessible at url https://arxiv.org/pdf/1402.6028.pdf
    """
    def __init__(
            self,
            arms_probs: [float],
            algo_parameters : EpsilonGreedyParameters,
    ):
        super().__init__(arms_probs, reward_seed=algo_parameters.reward_seed)
        self.epsilon = algo_parameters.epsilon
        self.epsilon_generator = IsolatedRandomGenerator(seed=randint_if_none(algo_parameters.epsilon_seed))
        self.random_arm_generator = IsolatedRandomGenerator(seed=randint_if_none(algo_parameters.random_arm_seed))

        self.epsilon_by_turn = {}

    def getParameters(self):
        return [
            ("epsilon", self.epsilon)
        ]

    def computeScore(self, turn : int, arm : int ) -> float:
        # probability epsilon: pulling a random arm
        # probability 1-epsilon: pullin the best arm
        x = self.epsilon_by_turn[turn] if turn in self.epsilon_by_turn else self.epsilon_generator.random(turn)
        self.epsilon_by_turn[ turn ] = x
        if x < self.epsilon:
            # randint returns a random integer between a and b includes
            # we consider a permutation done by the AS
            return 1
        else:
            return self.nbRewards( arm ) /  self.nbPull( arm )




    def selectArm(self, turn : int, scores : [float]) -> int:
        """Select the arm based on scores.
        """
        assert turn in self.epsilon_by_turn, 'Value compared with epsilon is not stored'

        x = self.epsilon_by_turn[turn]
        if x < self.epsilon:
            # randint returns a random integer between a and b includes
            # we consider a permutation done by the AS
            return self.random_arm_generator.randint(turn, 0, self.K - 1)
        else:
            return argmax( scores )

########################################################################################################################
# Thompson Sampling
########################################################################################################################
def thompson_sampling_function(s_i, n_i, beta_seed, t) -> float:
    """
    Executes the Thompson Sampling application based on work at
    https://perso.crans.org/besson/phd/notebooks/Introduction_aux_algorithmes_de_bandit__comme_UCB1_et_Thompson_Sampling.html#Approche-bay%C3%A9sienne,-Thompson-Sampling
    """
    seed(beta_seed + t)
    value = betavariate(alpha=s_i + 1, beta=n_i - s_i + 1)
    return value

class ThompsonsSamplingParameters:
    def __init__(self, reward_seed, beta_seed, random_arm_seed):
        self.reward_seed = reward_seed
        self.beta_seed = beta_seed
        self.random_arm_seed = random_arm_seed

class ThompsonSamplingBanditsAlgorithm(StandardBanditsAlgorithm):

    def __init__(self, probs: [float], algo_parameters : ThompsonsSamplingParameters):
        super().__init__(probs, reward_seed=algo_parameters.reward_seed)
        # seeds
        self.beta_seed = algo_parameters.beta_seed
        self.random_arm_selector = IsolatedRandomGenerator(seed=algo_parameters.random_arm_seed)
        

    def computeScore(self, turn : int, arm : int ) -> float:
        return thompson_sampling_function(
            s_i=self.nbRewards(arm),
            n_i=self.nbPull(arm),
            beta_seed=self.beta_seed,
            t=turn,
        )


    def selectArm(self, turn : int, scores : [float]) -> int:
        """Select the arm based on scores.
        """
        return argmax( scores )





########################################################################################################################
# UCB
########################################################################################################################
def ucb_function( turn, s_i, n_i ):
    exploitation_term = s_i / n_i
    exploration_term = sqrt((2 * log(turn, e)) / n_i)
    return exploitation_term + exploration_term

class UCBParameters:
    def __init__(self, reward_seed):
        self.reward_seed = reward_seed

class UCBBanditsAlgorithm(StandardBanditsAlgorithm):
    """
    Implementation of the standard UCB-1 bandits algorithm.
    It follows the standard defined in the paper "Algorithms for the multi-armed bandit problem"
    accessible at url https://arxiv.org/pdf/1402.6028.pdf
    """
    def __init__(self, arms_probs: [float], algo_parameters : UCBParameters):
        super().__init__(arms_probs, reward_seed=algo_parameters.reward_seed)


    def computeScore(self, turn : int, arm : int ) -> float:
        return ucb_function(
            turn,
            s_i=self.nbRewards(arm),
            n_i=self.nbPull(arm)
        )

    def selectArm(self, turn : int, scores : [float]) -> int:
        """Select the arm based on scores.
        """
        return argmax( scores )


###################################################
# Softmax
###################################################
def softmax_function(s_i: int, n_i: int, tau: float) -> float:
    """Softmax score computation function.

    Returns:
        e^{\\frac{\\frac{s_i}{n_i}}{\\tau}
    """
    assert n_i != 0, 'Number of pulls cannot be equals to 0'
    assert tau != 0, 'tau cannot be equals to 0'
    return exp((s_i / n_i) / tau)


def divide_each_by_sum(values: [float]) -> [float]:
    """Divide each item of the given list by the sum of the list."""
    s = sum(values)
    if s == 0: s = 1
    return [v / s for v in values]


class SoftmaxParameters:
    """
    Softmax parameters.
    """

    def __init__(self, tau, reward_seed, random_arm_seed):
        self.reward_seed = reward_seed
        self.tau = tau
        self.random_arm_choice = random_arm_seed


class SoftmaxBanditsAlgorithm(StandardBanditsAlgorithm):
    """Softmax standard bandits algorithm.
    It follows the standard defined in the paper "Algorithms for the multi-armed bandit problem"
    accessible at url https://arxiv.org/pdf/1402.6028.pdf
    """

    def __init__(self, arms_probs: [float], algo_parameters: SoftmaxParameters):
        super().__init__(arms_probs, reward_seed=algo_parameters.reward_seed)
        self.tau = algo_parameters.tau
        self.random_arm_selector =  IsolatedRandomGenerator(seed=algo_parameters.random_arm_choice)

    def getParameters(self):
        return [('tau', self.tau)]


    def computeScore(self, turn : int, arm : int ) -> float:
        return softmax_function(
            tau=self.tau,
            s_i=self.nbRewards(arm),
            n_i=self.nbPull(arm)
        )

    def selectArm(self, turn : int, scores : [float]) -> int:
        """Select the arm based on scores.
        """
        return self.random_arm_selector.choice(range(self.K), scores, t=turn)


# ===============================================
# Execution
# ===============================================
class ExecutionHistoryManager:
    UCB="ucb"
    SOFTMAX="softmax"
    THOMPSON_SAMPLING="thompson-sampling"
    EPSILON_GREEDY="epsilon-greedy"

    def __init__(self, budget, nb_iterations, probs) -> None:
        self.budget = budget
        self.nb_iterations = nb_iterations
        self.probs = probs
        self.history = {
            ExecutionHistoryManager.UCB: {},
            ExecutionHistoryManager.SOFTMAX: {},
            ExecutionHistoryManager.THOMPSON_SAMPLING: {},
            ExecutionHistoryManager.EPSILON_GREEDY: {}
        }

    def add_execution( self, algorithm : str, iteration : int, execution : ExecutionHistory ):
        self.history[ algorithm ][ iteration ] = execution.export_as_dict()

    def export( self, output : str ) :
        """Exports all executions in the given output location.

        Once the function will be executed, many files with be created inside the given location.
        """
        # to reduce the energy consumption on the client web browser, we
        # compute an aggregation of data.
        algorithm_list = [
            ExecutionHistoryManager.UCB,
            ExecutionHistoryManager.SOFTMAX,
            ExecutionHistoryManager.THOMPSON_SAMPLING,
            ExecutionHistoryManager.EPSILON_GREEDY,
        ]

        # export each execution in a file, one file for a single algorithm and iteration
        for algo, data_by_iteration in self.history.items():
            for iteration, data in data_by_iteration.items():
                with open( join( output, f"execution_{algo}_{iteration}.json" ), 'w' ) as file:
                    file.write(json.dumps(data))





def launch_execution( executions, nb_iterations, tau, epsilon, output ):
    currentExecution = 1
    for datasetName, data in executions.items():
        for probs, budget, threshold in data:
            execution_history = ExecutionHistoryManager( budget=budget, nb_iterations=nb_iterations, probs=probs )

            # compute each execution
            algorithm_list = [
                ExecutionHistoryManager.UCB,
                ExecutionHistoryManager.SOFTMAX,
                ExecutionHistoryManager.THOMPSON_SAMPLING,
                ExecutionHistoryManager.EPSILON_GREEDY,
            ]

            # create a algorithm wrapper able to create an instance of algorithm generated with random seeds
            def randseed() -> int: return randint(1, 10000)
            def create_instance( algorithm : str ) -> StandardBanditsAlgorithm:
                if algorithm == ExecutionHistoryManager.UCB:
                    return UCBBanditsAlgorithm(
                        arms_probs=probs,
                        algo_parameters=UCBParameters(
                            reward_seed=randseed()
                        )
                    )
                elif algorithm == ExecutionHistoryManager.SOFTMAX:
                    return SoftmaxBanditsAlgorithm(
                        probs,
                        algo_parameters=SoftmaxParameters(
                            tau=tau,
                            reward_seed=randseed(),
                            random_arm_seed=randseed()
                        )
                    )
                elif algorithm == ExecutionHistoryManager.EPSILON_GREEDY:
                    return EpsilonGreedyBanditsAlgorithm(
                        arms_probs=probs,
                        algo_parameters=EpsilonGreedyParameters(
                            epsilon=epsilon,
                            epsilon_seed=randseed(),
                            reward_seed=randseed(),
                            random_arm_seed=randseed()
                        )
                    )
                elif algorithm == ExecutionHistoryManager.THOMPSON_SAMPLING:
                    return ThompsonSamplingBanditsAlgorithm(
                        probs=probs,
                        algo_parameters=ThompsonsSamplingParameters(
                            reward_seed=randseed(),
                            beta_seed=randseed(),
                            random_arm_seed=randseed()
                        )
                    )
                else:
                    raise Exception("Cannot create an instance of the specified algorithm: Algorithm not found: ", algorithm)

            
        
            mean_time_by_components = None
            for algorithm in algorithm_list:
                for iteration in range(nb_iterations):
                    # display some details about the execution
                    nbExecutions = len(executions.items()) * len(data) * len(algorithm_list) * nb_iterations
                    print(f"\r[Progression {round(currentExecution / nbExecutions * 100)}%] Dataset {datasetName} -- Executing Algorithm {algorithm} -- probs {probs}, threshold {threshold}, budget {budget}({iteration + 1}/{nb_iterations})", end=" " * 10)


                    # execution standard bandits
                    
                    algorithm_instance = create_instance( algorithm )
                    execution = algorithm_instance.play( budget )
                    execution_history.add_execution( algorithm, iteration, execution )

                    # execute bandits to get components execution time
                    timer = SambaTimer( create_instance( algorithm ) )
                    one_time_by_components = timer.time( budget )
                    if not mean_time_by_components:
                        mean_time_by_components = one_time_by_components
                    else:
                        for node in ["comp", "controller", "customer"]:
                            mean_time_by_components[node] += one_time_by_components[node]
                        for arm, arm_execution_time in enumerate( one_time_by_components["arms"] ):
                            mean_time_by_components["arms"][arm] += arm_execution_time

                    currentExecution += 1
            for node in ["comp", 'controller', 'customer']:
                mean_time_by_components[node] /= nb_iterations
            for arm in range(len(probs)):
                mean_time_by_components["arms"][arm] /= nb_iterations


            # ensures that the output folder exists
            folder = os.path.join(output, f"{datasetName}_{len(probs)}_{threshold}")
            if not os.path.exists(folder):
                os.mkdir( folder )

            # export the execution
            execution_history.export( folder )
            with open(os.path.join(folder, "execution_time_by_components.json"), "w") as file:
                file.write(json.dumps(mean_time_by_components))
    print("\n[+] Execution done")


from timeit import timeit
def benchmark_security_options( output ):
    randseed = lambda: randint(1, 10000)
    nb_iteration = 10000

    # compute execution time for permutation
    mean_permutation_execution_time = 0.
    list_size = 100
    permutation = IsolatedPermutation.new( list_size, perm_seed=randseed(), turn=1 )
    l = [i for i in range(list_size)]
    for _ in range( nb_iteration ):
        t = time.time()
        permutation.permute(l)
        mean_permutation_execution_time += time.time() - t
    mean_permutation_execution_time /= nb_iteration
    

    

    # compute execution time for appying mask
    mask = 0.5
    mean_mask_execution_time = timeit(
        lambda: mask * 4.123456789,
        number=nb_iteration
    )

    # both Paillier and AES primitives
    time_Paillier_enc = 0.
    time_Paillier_dec = 0.
    time_Paillier_add = 0.
    time_AES_enc = 0.
    time_AES_dec = 0.
    nb_runs = 100
    N = 100000
    K = 10

    # Paillier
    pk, sk = paillier.generate_paillier_keypair()

    for i in range(nb_runs):
        # draw a random message
        m = randint(0, N)
        
        
        
        t = time.time()
        c = pk.encrypt(m)
        time_Paillier_enc += time.time() - t
        
        t = time.time()
        m2 = sk.decrypt (c)
        time_Paillier_dec += time.time() - t
        assert (m == m2)

        t = time.time()
        c + c
        time_Paillier_add += time.time() - t
        
        # AES
        key = get_random_bytes(32)
        aesgcm = AESGCM(key)
        nonce = os.urandom(12)
        
        t = time.time()
        c = aesgcm.encrypt(nonce, str(m).encode('utf-8'), None)
        time_AES_enc += time.time() - t
        
        t = time.time()
        m2 = int(aesgcm.decrypt(nonce, c, None))
        time_AES_dec += time.time() - t
        assert (m == m2)
    
    time_Paillier_enc /= nb_runs
    time_Paillier_dec /= nb_runs
    time_Paillier_add /= nb_runs
    time_AES_enc /= nb_runs
    time_AES_dec /= nb_runs
    diff_enc = time_Paillier_enc - time_AES_enc
    diff_dec = time_Paillier_dec - time_AES_dec

    # exporting result
    data = {
        "permutation": mean_permutation_execution_time,
        "mask": mean_mask_execution_time,
        "aes": { "encryption":time_AES_enc, "decryption": time_AES_dec },
        "paillier": { "encryption": time_Paillier_enc, "decryption": time_Paillier_dec, "addition": time_Paillier_add }
    }
    with open( os.path.join( output, "security.json" ), 'w') as file:
        file.write( json.dumps( data ) )

from argparse import ArgumentParser
def createParser():
    parser = ArgumentParser()
    parser.add_argument( "--steam-probs", required=True )
    parser.add_argument( "--google-probs", required=True )
    return parser

# ===============================================
# Main
# ===============================================
if __name__ == "__main__":

    # parser arguments
    parser = createParser()
    args = parser.parse_args()

    # read probs
    with open( args.steam_probs, 'r' ) as file:
        steam = json.loads( "".join(file.readlines()) )

    with open( args.google_probs, "r" ) as file:
        google = json.loads( "".join(file.readlines()) )

    budget_set = [
        1000,
    ]

    data = {
        'googlelocal': [],
        'steam': [],
    }
    createEntry = lambda budget, threshold, probs:  (probs, budget, threshold)
    for datasetName, dataset in [ ('steam', steam), ('googlelocal', google) ]:
        for k, datasetByThreshold in steam.items():
            for threshold, dataset in datasetByThreshold.items():
                for budget in budget_set:
                    data[datasetName].append(createEntry(budget, threshold, dataset))

    OUTPUT = "data"
    print("Recording samba execution...")
    launch_execution(
        executions=data,
        nb_iterations=20,
        tau=0.1,
        epsilon=0.1,
        output=OUTPUT
    )

    print("[*] Benchmarking security options...")
    benchmark_security_options( OUTPUT )

    print("Done")

