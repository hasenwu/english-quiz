import { useState, useEffect } from 'react';

// 题型常量
export const QUESTION_TYPES = {
  SPELL: 'spell',
  FILL: 'fill',
  CHINESE_TO_ENGLISH: 'chineseToEnglish',
  MEANING_TO_WORD: 'meaningToWord'
};

const useQuizLogic = (wordsData) => {
  // 状态管理
  const [mainQueue, setMainQueue] = useState([]);
  const [reviewQueue, setReviewQueue] = useState([]);
  const [retryBuffer, setRetryBuffer] = useState([]); // 错题本
  const [currentWord, setCurrentWord] = useState(null);
  const [currentQuestionType, setCurrentQuestionType] = useState(null);
  const [currentQuestionData, setCurrentQuestionData] = useState(null);
  const [options, setOptions] = useState([]);
  const [answered, setAnswered] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [newWordCount, setNewWordCount] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [questionTypesQueue, setQuestionTypesQueue] = useState([]);
  const [wordProgress, setWordProgress] = useState({}); // 跟踪每个单词的掌握进度
  const [masteredWordCount, setMasteredWordCount] = useState(0); // 已掌握的单词数

  // 初始化函数
  const initialize = () => {
    // 按列表顺序抽取单词，不打乱
    const orderedWords = [...wordsData];
    setMainQueue(orderedWords);
    setReviewQueue([]);
    setRetryBuffer([]);
    setCurrentWord(null);
    setCurrentQuestionType(null);
    setCurrentQuestionData(null);
    setOptions([]);
    setAnswered(false);
    setSelectedOption(null);
    setCorrectCount(0);
    setWrongCount(0);
    setNewWordCount(0);
    setIsCompleted(false);
    setQuestionTypesQueue([]);
    setWordProgress({});

    // 从 localStorage 初始化 masteredWordCount
    const storedMasteredCount = parseInt(localStorage.getItem('totalMasteredCount') || '0', 10);
    setMasteredWordCount(storedMasteredCount);

    // 延迟生成第一题，确保状态更新完成
    setTimeout(() => {
      generateQuestion();
    }, 0);
  };

  // 生成填空题模板
  const generateFillTemplate = (word) => {
    const length = word.length;
    const showLength = Math.ceil(length / 3);
    const hideLength = length - showLength;
    return word.substring(0, showLength) + '_'.repeat(hideLength);
  };

  // 生成干扰项
  const generateDistractors = (correctWord, type) => {
    const otherWords = wordsData.filter(w => w.word !== correctWord.word);
    const shuffledOthers = [...otherWords].sort(() => Math.random() - 0.5);
    
    if (type === QUESTION_TYPES.CHINESE_TO_ENGLISH) {
      return shuffledOthers.slice(0, 3).map(w => w.word);
    } else {
      return shuffledOthers.slice(0, 3).map(w => w.meaning);
    }
  };

  // 添加到错题本
  const addToRetryBuffer = (word, failedType) => {
    setRetryBuffer(prev => {
      const existingIndex = prev.findIndex(item => item.word.word === word.word);
      if (existingIndex >= 0) {
        // 已存在，添加新的错题类型
        const updated = [...prev];
        if (!updated[existingIndex].failedTypes.includes(failedType)) {
          updated[existingIndex].failedTypes.push(failedType);
        }
        return updated;
      } else {
        // 不存在，创建新条目
        return [...prev, { word, failedTypes: [failedType] }];
      }
    });
  };

  // 从错题本移除
  const removeFromRetryBuffer = (word, correctType) => {
    setRetryBuffer(prev => {
      const updated = prev
        .map(item => {
          if (item.word.word === word.word) {
            // 移除已答对的题型
            const newFailedTypes = item.failedTypes.filter(type => type !== correctType);
            if (newFailedTypes.length > 0) {
              return { ...item, failedTypes: newFailedTypes };
            } else {
              // 所有题型都答对了，返回null表示移除
              return null;
            }
          }
          return item;
        })
        .filter(Boolean); // 过滤掉null值
      return updated;
    });
  };

  // 生成新题目
  const generateQuestion = () => {
    // 检查是否完成
    if (mainQueue.length === 0 && retryBuffer.length === 0) {
      setIsCompleted(true);
      return;
    }

    // 选题逻辑
    let nextWord;
    let isRetry = false;

    // 1. 优先处理错题
    if (retryBuffer.length > 0) {
      const randomIndex = Math.floor(Math.random() * retryBuffer.length);
      const retryItem = retryBuffer[randomIndex];
      nextWord = retryItem.word;
      isRetry = true;
      
      // 生成该单词的错题类型队列
      const failedTypes = [...retryItem.failedTypes];
      setQuestionTypesQueue(failedTypes.slice(1));
      
      // 生成第一题
      generateQuestionByType(nextWord, failedTypes[0]);
      return;
    }
    // 2. 从 mainQueue 取
    else if (mainQueue.length > 0) {
      nextWord = mainQueue[0];
      setMainQueue(prev => prev.slice(1));
      setNewWordCount(prev => prev + 1);
      
      // 生成所有题型队列
      const allTypes = [QUESTION_TYPES.CHINESE_TO_ENGLISH, QUESTION_TYPES.MEANING_TO_WORD, QUESTION_TYPES.FILL, QUESTION_TYPES.SPELL];
      setQuestionTypesQueue(allTypes.slice(1));
      
      // 生成第一题
      generateQuestionByType(nextWord, allTypes[0]);
      return;
    }
  };

  // 根据题型生成题目
  const generateQuestionByType = (word, type) => {
    setCurrentWord(word);
    setCurrentQuestionType(type);
    setAnswered(false);
    setSelectedOption(null);

    switch (type) {
      case QUESTION_TYPES.SPELL:
      case QUESTION_TYPES.FILL:
        setOptions([]);
        setCurrentQuestionData({
          template: type === QUESTION_TYPES.FILL ? generateFillTemplate(word.word) : null
        });
        break;
      case QUESTION_TYPES.CHINESE_TO_ENGLISH:
        // 生成干扰项
        const chineseDistractors = generateDistractors(word, type);
        const chineseOptions = [word.word, ...chineseDistractors].sort(() => Math.random() - 0.5);
        setOptions(chineseOptions);
        setCurrentQuestionData(null);
        break;
      case QUESTION_TYPES.MEANING_TO_WORD:
        // 生成干扰项
        const meaningDistractors = generateDistractors(word, type);
        const meaningOptions = [word.meaning, ...meaningDistractors].sort(() => Math.random() - 0.5);
        setOptions(meaningOptions);
        setCurrentQuestionData(null);
        break;
    }
  };

  // 处理用户作答
  const handleAnswer = (answer) => {
    if (!answered && currentWord && currentQuestionType) {
      setSelectedOption(answer);
      setAnswered(true);

      let isCorrect = false;

      switch (currentQuestionType) {
        case QUESTION_TYPES.SPELL:
          isCorrect = answer.toLowerCase() === currentWord.word.toLowerCase();
          break;
        case QUESTION_TYPES.FILL:
          // 生成完整答案
          const template = currentQuestionData.template;
          const visibleLength = template.indexOf('_');
          const expectedAnswer = currentWord.word.substring(visibleLength);
          isCorrect = answer.toLowerCase() === expectedAnswer.toLowerCase();
          break;
        case QUESTION_TYPES.CHINESE_TO_ENGLISH:
          isCorrect = answer === currentWord.word;
          break;
        case QUESTION_TYPES.MEANING_TO_WORD:
          isCorrect = answer === currentWord.meaning;
          break;
      }

      if (isCorrect) {
        setCorrectCount(prev => prev + 1);

        // 更新单词掌握进度
        setWordProgress(prev => {
          const currentTypes = prev[currentWord.word] || [];
          if (!currentTypes.includes(currentQuestionType)) {
            const newTypes = [...currentTypes, currentQuestionType];
            // 检查是否完成所有题型
            if (newTypes.length === Object.keys(QUESTION_TYPES).length) {
              const newTotal = masteredWordCount + 1;
              setMasteredWordCount(newTotal);
              localStorage.setItem('totalMasteredCount', newTotal.toString());
            }
            return { ...prev, [currentWord.word]: newTypes };
          }
          return prev;
        });

        removeFromRetryBuffer(currentWord, currentQuestionType);
      } else {
        setWrongCount(prev => prev + 1);
        addToRetryBuffer(currentWord, currentQuestionType);
      }

      // 0.7秒后自动进入下一题
      setTimeout(() => {
        // 检查是否有下一个题型
        if (questionTypesQueue.length > 0) {
          const [nextType, ...remainingTypes] = questionTypesQueue;
          setQuestionTypesQueue(remainingTypes);
          generateQuestionByType(currentWord, nextType);
        } else {
          // 该单词的所有题型都已完成，取下一个单词
          generateQuestion();
        }
      }, 700);

      return isCorrect;
    }
    return false;
  };

  // 播放发音
  const playPronunciation = (text) => {
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      speechSynthesis.speak(utterance);
    }
  };

  // 判断是否完成
  const checkCompletion = () => {
    return mainQueue.length === 0 && retryBuffer.length === 0;
  };

  // 初始化
  useEffect(() => {
    if (wordsData && wordsData.length > 0) {
      initialize();
    }
  }, [wordsData]);

  return {
    currentWord,
    currentQuestionType,
    currentQuestionData,
    options,
    answered,
    selectedOption,
    correctCount,
    wrongCount,
    isCompleted,
    masteredWordCount, // 导出已掌握的单词数
    handleAnswer,
    generateQuestion,
    initialize,
    mainQueue,
    reviewQueue,
    retryBuffer,
    questionTypesQueue,
    playPronunciation,
    addToRetryBuffer,
    removeFromRetryBuffer,
    generateFillTemplate,
    QUESTION_TYPES
  };
};

export default useQuizLogic;