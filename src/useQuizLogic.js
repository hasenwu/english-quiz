import { useState, useEffect } from 'react';

const useQuizLogic = (wordsData) => {
  // 状态管理
  const [mainQueue, setMainQueue] = useState([]);
  const [reviewQueue, setReviewQueue] = useState([]);
  const [retryBuffer, setRetryBuffer] = useState([]); // 临时用于显示
  const [wrongWords, setWrongWords] = useState([]); // 记录错题
  const [unfamiliarWords, setUnfamiliarWords] = useState([]); // 记录不熟练单词
  const [wordCountSinceWrong, setWordCountSinceWrong] = useState(0); // 记录答错后已答单词数
  const [currentWord, setCurrentWord] = useState(null);
  const [options, setOptions] = useState([]);
  const [answered, setAnswered] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [newWordCount, setNewWordCount] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  // 初始化函数
  const initialize = () => {
    // 打乱单词顺序
    const shuffledWords = [...wordsData].sort(() => Math.random() - 0.5);
    setMainQueue(shuffledWords);
    setReviewQueue([]);
    setRetryBuffer([]);
    setWrongWords([]);
    setUnfamiliarWords([]);
    setWordCountSinceWrong(0);
    setCurrentWord(null);
    setOptions([]);
    setAnswered(false);
    setSelectedOption(null);
    setCorrectCount(0);
    setWrongCount(0);
    setNewWordCount(0);
    setIsCompleted(false);

    // 生成第一题
    generateQuestion();
  };

  // 生成干扰项
  const generateDistractors = (correctWord) => {
    const otherWords = wordsData.filter(w => w.word !== correctWord.word);
    const shuffledOthers = [...otherWords].sort(() => Math.random() - 0.5);
    const distractors = shuffledOthers.slice(0, 3).map(w => w.meaning);
    return distractors;
  };

  // 生成新题目
  const generateQuestion = () => {
    // 检查是否完成
    if (mainQueue.length === 0 && wrongWords.length === 0 && unfamiliarWords.length === 0) {
      if (wrongCount <= 3) {
        setIsCompleted(true);
      }
      return;
    }

    // 选题逻辑
    let nextWord;

    // 1. 优先处理错题（当已答5个单词后）
    if (wrongWords.length > 0 && wordCountSinceWrong >= 5) {
      // 从错题中随机选择一个
      const randomIndex = Math.floor(Math.random() * wrongWords.length);
      nextWord = wrongWords[randomIndex];
      // 从错题列表中移除
      setWrongWords(prev => prev.filter((_, index) => index !== randomIndex));
      // 重置计数
      setWordCountSinceWrong(0);
    }
    // 2. 从 mainQueue 取
    else if (mainQueue.length > 0) {
      nextWord = mainQueue[0];
      setMainQueue(prev => prev.slice(1));
      setNewWordCount(prev => prev + 1);
      setWordCountSinceWrong(prev => prev + 1);

      // 每取5个新词，从 reviewQueue 随机抽1个插入到 mainQueue 头部
      if (newWordCount % 5 === 4 && reviewQueue.length > 0) {
        const randomIndex = Math.floor(Math.random() * reviewQueue.length);
        const reviewWord = reviewQueue[randomIndex];
        setMainQueue(prev => [reviewWord, ...prev]);
      }
    }
    // 3. 若 mainQueue 空了，从 unfamiliarWords 取
    else if (unfamiliarWords.length > 0) {
      nextWord = unfamiliarWords[0];
      setUnfamiliarWords(prev => prev.slice(1));
      setWordCountSinceWrong(prev => prev + 1);
    }
    // 4. 若 unfamiliarWords 也空了，从 reviewQueue 取
    else if (reviewQueue.length > 0) {
      nextWord = reviewQueue[0];
      setReviewQueue(prev => prev.slice(1));
      setWordCountSinceWrong(prev => prev + 1);
    }
    // 5. 若都空了，从 wrongWords 取（强制处理错题）
    else if (wrongWords.length > 0) {
      const randomIndex = Math.floor(Math.random() * wrongWords.length);
      nextWord = wrongWords[randomIndex];
      setWrongWords(prev => prev.filter((_, index) => index !== randomIndex));
      setWordCountSinceWrong(0);
    }

    if (nextWord) {
      // 生成干扰项
      const distractors = generateDistractors(nextWord);
      
      // 合并选项并打乱顺序
      const allOptions = [nextWord.meaning, ...distractors];
      const shuffledOptions = [...allOptions].sort(() => Math.random() - 0.5);
      
      setCurrentWord(nextWord);
      setOptions(shuffledOptions);
      setAnswered(false);
      setSelectedOption(null);
    }
  };

  // 处理用户作答
  const handleAnswer = (option) => {
    if (!answered && currentWord) {
      setSelectedOption(option);
      setAnswered(true);

      const isCorrect = option === currentWord.meaning;

      if (isCorrect) {
        // 答对 → 移入 reviewQueue
        setReviewQueue(prev => [...prev, currentWord]);
        setCorrectCount(prev => prev + 1);
        
        // 检查是否是第二次答对（从错题本中移除并加入不熟练单词列表）
        if (wrongWords.some(w => w.word === currentWord.word)) {
          // 从错题本移除
          setWrongWords(prev => prev.filter(w => w.word !== currentWord.word));
          // 加入不熟练单词列表
          if (!unfamiliarWords.some(w => w.word === currentWord.word)) {
            setUnfamiliarWords(prev => [...prev, currentWord]);
          }
        }
      } else {
        // 答错 → 添加到错题列表，5个单词后再重测
        setWrongCount(prev => prev + 1);
        // 检查是否已在错题列表中
        if (!wrongWords.some(w => w.word === currentWord.word)) {
          setWrongWords(prev => [...prev, currentWord]);
        }
      }

      // 0.7秒后自动进入下一题
      setTimeout(generateQuestion, 700);
    }
  };

  // 判断是否完成
  const checkCompletion = () => {
    return mainQueue.length === 0 && wrongWords.length === 0 && unfamiliarWords.length === 0 && wrongCount <= 3;
  };

  // 初始化
  useEffect(() => {
    if (wordsData && wordsData.length > 0) {
      initialize();
    }
  }, [wordsData]);

  return {
    currentWord,
    options,
    answered,
    selectedOption,
    correctCount,
    wrongCount,
    isCompleted,
    handleAnswer,
    generateQuestion,
    initialize,
    mainQueue,
    reviewQueue,
    retryBuffer,
    wrongWords,
    unfamiliarWords
  };
};

export default useQuizLogic;