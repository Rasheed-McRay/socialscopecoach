import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AudioWaveform, Mic, CheckCircle2, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { HeaderNav } from "@/components/HeaderNav";
import { HomeRecorder } from "@/components/HomeRecorder";
import { DailyScopeAnalysis } from "@/components/DailyScopeAnalysis";
import { ProFeatureGate } from "@/components/ProFeatureGate";
import { supabase } from "@/integrations/supabase/client";
import { transcribeAudio } from "@/lib/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

// Daily scope prompts - open-ended questions that encourage thoughtful, detailed responses
// 365 open-ended daily prompts — one per day of the year, cycled in order.
const DAILY_PROMPTS = [
  "What's a belief you held strongly in the past that you've since changed your mind about, and what led to that shift?",
  "Describe a moment in your life that fundamentally changed how you see the world.",
  "If you could redesign how society approaches education, what would you change and why?",
  "Tell me about a person who shaped who you are today, and explain the specific ways they influenced you.",
  "What's something you're currently struggling with, and how are you approaching it?",
  "Describe a time when you were completely wrong about something important. What did you learn?",
  "If you could have a conversation with your younger self, what would you want them to understand?",
  "What does success mean to you, and how has that definition evolved over time?",
  "Describe a fear you've overcome and the journey it took to get there.",
  "What's a controversial opinion you hold, and walk me through your reasoning?",
  "Tell me about a failure that ultimately led to something positive in your life.",
  "If you could solve one problem in your community, what would it be and how would you approach it?",
  "Describe a skill or hobby you've always wanted to pursue but haven't yet. What's holding you back?",
  "What's the most meaningful gift you've ever given or received, and what made it special?",
  "Tell me about a time when you had to make a difficult decision with no clear right answer.",
  "How do you define authenticity, and where do you feel most authentic in your life?",
  "Describe a cultural tradition or practice that's meaningful to you and explain its significance.",
  "What's something you wish more people understood about you or your experiences?",
  "If you could change one thing about how you communicate with others, what would it be?",
  "Tell me about a book, movie, or piece of art that deeply affected you and why.",
  "What role does vulnerability play in your relationships, and how has that evolved?",
  "Describe a time when you stood up for something you believed in, even when it was difficult.",
  "What's a question you've been asking yourself lately, and where are you in finding the answer?",
  "Tell me about a relationship in your life that has taught you the most about yourself.",
  "If you could master any subject or field overnight, what would you choose and what would you do with that knowledge?",
  "Describe your ideal day from start to finish, including who you'd spend it with and where.",
  "What's something about the way you were raised that you're grateful for, and something you'd do differently?",
  "Tell me about a time when you felt truly understood by someone. What made that connection special?",
  "How do you handle disagreements with people you care about? What's your approach?",
  "Describe a place that feels like home to you, even if it's not where you live.",
  "What's a habit or pattern in your life that you're working to change?",
  "Tell me about a risk you took that didn't work out. How do you feel about it now?",
  "If you could give everyone in the world one piece of advice, what would it be and why?",
  "Describe a moment when you felt truly proud of yourself, beyond any external recognition.",
  "What does friendship mean to you, and how has your understanding of it changed?",
  "Tell me about a time when your perspective was broadened by someone very different from you.",
  "What's something you do regularly that brings you peace or grounds you?",
  "Describe a challenge you're currently facing and how you're thinking about approaching it.",
  "If you could witness any historical event firsthand, what would you choose and why?",
  "What's a lesson you keep having to relearn in your life?",
  "Tell me about someone you admire from afar and what specifically draws you to them.",
  "How do you think about your legacy? What do you hope people remember about you?",
  "Describe a time when you surprised yourself with your own capabilities.",
  "What's something you've created that you're proud of, and what was the process like?",
  "Tell me about a boundary you've had to set in your life and how it affected your relationships.",
  "If you could have any career for a year without worrying about money, what would you choose?",
  "What's the most important conversation you've ever had, and what made it so impactful?",
  "Describe how your relationship with yourself has changed over the years.",
  "What's something you believe that most people around you would disagree with?",
  "Tell me about a time when you chose kindness over being right.",
  "How do you want to grow as a person in the next year, and what steps are you taking?",
  "Describe a moment of unexpected joy or beauty you experienced recently.",
  "What's a story from your family history that has influenced who you are?",
  "Tell me about a mentor or guide who appeared in your life when you needed them most.",
  "If you could change one thing about how you spend your time, what would it be?",
  "What does courage mean to you, and when have you had to be courageous?",
  "Describe a time when you had to let go of something or someone important to you.",
  "What's the most valuable thing you've learned from a mistake?",
  "Tell me about a time when you felt completely out of your depth. How did you handle it?",
  "How do you approach making decisions that affect other people's lives?",
  "Describe what balance means to you and how you try to achieve it.",
  "What's something you used to judge others for that you now understand differently?",
  "Tell me about a tradition you've started or want to start in your life.",
  "If you could ask one question and get an absolutely truthful answer, what would you ask?",
  "What's the hardest thing about being you, and how do you cope with it?",
  "Describe a time when you felt genuinely heard and seen by another person.",
  "What role does gratitude play in your life, and how do you practice it?",
  "Tell me about a time when you had to rebuild trust with someone.",
  "How do you handle uncertainty and ambiguity in your life?",
  "Describe a crossroads moment in your life and how you chose which path to take.",
  "What's something you're passionate about that people might not expect?",
  "Tell me about a time when you changed someone's mind about something important.",
  "If you could relive one year of your life with your current wisdom, which would you choose and why?",
  "What does it mean to you to live a meaningful life?",
  "Describe a time when you felt truly free. What were the circumstances?",
  "What's the most difficult feedback you've ever received, and how did you respond to it?",
  "Tell me about a goal you're working toward and the obstacles you're facing.",
  "How has your definition of happiness evolved throughout your life?",
  "Describe a time when you had to advocate for yourself in a difficult situation.",
  "What's something you wish you had started earlier in life?",
  "Tell me about a conflict that ultimately strengthened a relationship.",
  "If you could spend a week living someone else's life, whose would you choose and why?",
  "What values do you hold that you're unwilling to compromise on, no matter what?",
  "Describe how you've grown as a communicator over the years.",
  "What's a dream you've had to let go of, and how have you made peace with that?",
  "Tell me about a time when you felt like an outsider and how that shaped you.",
  "How do you stay motivated when things get difficult?",
  "Describe a person in your life who challenges you to be better.",
  "What's something you've forgiven yourself for that was hard to let go of?",
  "Tell me about a moment when you realized you were becoming the person you wanted to be.",
  "If you could change one aspect of human nature, what would it be and why?",
  "What's the most important thing you've learned about communication?",
  "Describe a time when you had to be vulnerable to get what you needed.",
  "How do you define love, and how has that definition changed for you?",
  "Tell me about a time when you stepped outside your comfort zone and what you discovered.",
  "What's something about the world today that gives you hope?",
  "Describe how you process and work through strong emotions.",
  "What's a quality in others that you find most admirable, and why?",
  "Tell me about a time when you had to trust the process without knowing the outcome.",
  "If you could give your community one gift, what would it be?",
  "What does home mean to you, beyond just a physical place?",
  "Describe a season of life you'd return to if you could, and what you'd savor differently.",
  "What part of your identity took you the longest to accept, and what helped you embrace it?",
  "Tell me about a compliment you received that you're still thinking about today.",
  "If you stripped away every external expectation, what would you actually want your life to look like?",
  "Describe a time you misjudged someone and later saw them more clearly.",
  "What's a question you wish more people asked each other?",
  "Tell me about a small daily ritual that means more to you than it probably should.",
  "What do you do when your values come into conflict with each other?",
  "Describe the last time you laughed so hard you cried, and what set it off.",
  "What's something you used to want desperately that you'd now politely decline?",
  "Tell me about a stranger who unexpectedly changed your day.",
  "How do you tell the difference between intuition and fear?",
  "Describe a piece of advice you ignored that you now wish you'd taken.",
  "What's a part of your life right now that future-you will look back on fondly?",
  "Tell me about a place you've never been but feel inexplicably drawn to.",
  "What does it mean to you to be a good friend, and where do you fall short?",
  "Describe a time you had to choose between honesty and comfort.",
  "What's something you've been avoiding, and what would it take to face it?",
  "Tell me about a song or sound that instantly takes you somewhere else.",
  "How has technology changed the way you relate to the people closest to you?",
  "Describe a moment when silence said more than words could have.",
  "What's a small act of generosity that left a lasting mark on you?",
  "Tell me about an opinion you keep mostly to yourself, and why.",
  "If you could rewrite one rule you grew up believing, which would it be?",
  "Describe a time when slowing down taught you something speed never could.",
  "What's the difference between who you are and who you're becoming?",
  "Tell me about a moment you felt deeply at peace with where your life is.",
  "How do you decide when to keep trying and when to walk away?",
  "Describe a piece of yourself you only show to people you really trust.",
  "What's something you're proud of that you've never told anyone?",
  "Tell me about a teacher — formal or not — whose lesson still echoes in your life.",
  "If you could erase one regret without erasing what it taught you, would you?",
  "Describe what you think people get wrong about you on first impression.",
  "What's a hard truth you've made friends with?",
  "Tell me about a time when changing your mind cost you something — and was worth it.",
  "How do you know when a relationship has run its course?",
  "Describe a moment you wish you could press pause on and live inside forever.",
  "What's something you're learning about yourself right now?",
  "Tell me about a way your parents shaped you that you've only recently noticed.",
  "If your life were a book, what would the current chapter be called?",
  "Describe a fear that protects you, and one that's holding you back.",
  "What's the bravest thing you've done that no one else would call brave?",
  "Tell me about a conversation you've been avoiding and what you wish you could say.",
  "How do you measure a day well spent?",
  "Describe a moment you felt unmistakably alive.",
  "What's a tradition from your past you want to carry into your future?",
  "Tell me about an apology — given or received — that changed something.",
  "If you could keep only five memories, how would you choose?",
  "Describe a habit you have that you secretly love about yourself.",
  "What's a story you tell about yourself that you're starting to question?",
  "Tell me about something you used to hate that you now appreciate.",
  "How has your relationship with money shaped your choices?",
  "Describe what it feels like when you're working at your absolute best.",
  "What's something you do to feel close to people who aren't physically near you?",
  "Tell me about a time you felt invisible, and what you wish someone had noticed.",
  "If you had to teach a class on one thing you know well, what would it be?",
  "Describe a moment when you understood your parents in a new way.",
  "What's a small joy in your week that you'd defend fiercely if anyone tried to take it?",
  "Tell me about a season of struggle that turned into a season of growth.",
  "How do you want to be loved, specifically, on your hardest days?",
  "Describe a time you said yes when you wanted to say no — and what it cost you.",
  "What's something about getting older that no one warned you about?",
  "Tell me about a place from your childhood that still lives vividly in your memory.",
  "If you could invite three people — living or not — to dinner, who and why?",
  "Describe an emotion you have a complicated relationship with.",
  "What's a part of your work or daily life that feels like play?",
  "Tell me about a time you trusted yourself when no one else did.",
  "How do you define rest, and when did you last truly experience it?",
  "Describe what loyalty looks like to you in practice, not in theory.",
  "What's a piece of wisdom from a much older or much younger person that stuck with you?",
  "Tell me about a chapter of your life you'd describe as 'before and after.'",
  "If you could spend an hour anywhere on Earth right now, where would you go?",
  "Describe the version of yourself you're quietly working toward.",
  "What's something you've been carrying that you're ready to put down?",
  "Tell me about a friendship that ended, and what it taught you.",
  "How do you handle the gap between who you are and who you want to be?",
  "Describe a moment of grace — given or received — that you didn't expect.",
  "What's a question you wish someone would ask you?",
  "Tell me about a time you were brave in a quiet, unglamorous way.",
  "If you could send a message to everyone who's ever hurt you, what would you say?",
  "Describe a small detail of someone you love that you notice and treasure.",
  "What's something you used to chase that no longer interests you?",
  "Tell me about a moment you felt completely seen for who you really are.",
  "How do you process disappointment in people you care about?",
  "Describe what your inner critic sounds like, and how you talk back to it.",
  "What's a way your sense of humor has evolved over time?",
  "Tell me about a time you took a leap and didn't look down.",
  "If your younger self saw your life now, what would surprise them most?",
  "Describe a moment you felt deeply connected to something larger than yourself.",
  "What's the kindest thing you've ever done that no one knows about?",
  "Tell me about a piece of writing — a letter, a text, a journal entry — that changed something for you.",
  "How do you make sense of suffering, your own or others'?",
  "Describe a relationship in your life that requires more from you than it gives — and why you stay.",
  "What's something you used to be sure of that now feels more like a question?",
  "Tell me about a time when ordinary became extraordinary without warning.",
  "If you could give yourself permission for one thing, what would it be?",
  "Describe how your idea of beauty has changed as you've gotten older.",
  "What's a fear you've never quite named out loud?",
  "Tell me about a person whose absence still shapes your life.",
  "How do you decide what's worth fighting for?",
  "Describe a moment you realized you'd outgrown something you used to need.",
  "What's a small way you're trying to be better than you were last year?",
  "Tell me about a time you helped someone in a way they didn't expect.",
  "If you could keep one feeling forever, which would it be?",
  "Describe what it feels like to be misunderstood, and how you respond to it.",
  "What's a moment you'd consider a turning point in how you see yourself?",
  "Tell me about an unfinished part of your life that's still asking for attention.",
  "How do you hold hope when things feel uncertain?",
  "Describe a part of yourself that's grown stronger because of something hard.",
  "What's a small change you made that turned out to matter more than you thought?",
  "Tell me about a moment you wish you had handled differently — and what you'd do now.",
  "If you could undo one fear, what would your life open up to?",
  "Describe what kindness looks like when no one's watching.",
  "What's something you've been told about yourself that you've slowly come to believe?",
  "Tell me about a time you let curiosity outweigh comfort.",
  "How do you tell the people you love that you love them?",
  "Describe a season of your life that quietly transformed you.",
  "What's a question you'd ask the version of yourself ten years from now?",
  "Tell me about a tradition or routine you'd be sad to lose.",
  "If you had to capture this current chapter of your life in one sentence, what would it say?",
  "Describe a moment you forgave someone — not for them, but for yourself.",
  "What's something you've been protecting that no longer needs protection?",
  "Tell me about a place where time seems to move differently for you.",
  "How do you keep your sense of wonder alive?",
  "Describe what it would mean to live in alignment with your deepest values.",
  "What's a part of your story you're still figuring out how to tell?",
  "Tell me about a moment you chose growth over comfort.",
  "If you could write a letter to anyone right now — knowing they'd actually read it — who would it be to?",
  "Describe a feeling you find hard to put into words.",
  "What's a way you've changed that you're genuinely proud of?",
  "Tell me about a piece of your past that you've made peace with.",
  "How do you respond when life asks more of you than you think you can give?",
  "Describe an ordinary day from your life that you'd happily live again.",
  "What's a quiet ambition you carry that you don't talk about often?",
  "Tell me about a time you felt truly held — emotionally, not physically — by someone.",
  "If you could free yourself from one expectation, which would you choose?",
  "Describe a way your inner world has changed in the last year.",
  "What's something you've discovered about love by paying close attention?",
  "Tell me about a moment you felt the gap between who you were and who you wanted to be — and what you did with it.",
  "How do you make room for joy when life feels heavy?",
  "Describe a sound, smell, or texture that instantly grounds you.",
  "What's a story from your life you've never told because no one's asked the right question?",
  "Tell me about a person who loved you in a way that taught you how to love yourself.",
  "If you could leave one piece of yourself behind in the world, what would it be?",
  "Describe a moment you understood something old in a brand new way.",
  "What's a way you're stronger now than you were five years ago?",
  "Tell me about a goal you abandoned that you don't regret abandoning.",
  "How do you know when you're being honest with yourself?",
  "Describe a hard conversation you're glad you had.",
  "What's something small that consistently makes you feel like yourself?",
  "Tell me about a moment you saw your own life from the outside.",
  "If you could redo one conversation, which would it be — and what would change?",
  "Describe how you want to show up for the people in your life this year.",
  "What's a way you've quietly rebelled against who others wanted you to be?",
  "Tell me about a memory that always feels like coming home.",
  "How do you decide what to give your attention to?",
  "Describe a moment you felt brave without realizing it at the time.",
  "What's a way you're more gentle with yourself now than you used to be?",
  "Tell me about something you used to overlook that now feels essential.",
  "If your life had a soundtrack right now, what would the first song be?",
  "Describe a belief you've inherited that you're still deciding whether to keep.",
  "What's a part of your routine that feels almost sacred?",
  "Tell me about a relationship that taught you what you don't want.",
  "How do you find your way back to yourself when you've drifted?",
  "Describe a way your idea of family has expanded over time.",
  "What's something you'd want a stranger to know about you?",
  "Tell me about a time you spoke up when it would have been easier to stay quiet.",
  "If you could turn one regret into a lesson out loud, what would you say?",
  "Describe a part of your life right now that feels like an answer to an earlier prayer.",
  "What's a way you've learned to be a better friend to yourself?",
  "Tell me about a moment you realized you'd healed from something.",
  "How do you make peace with the things you can't change?",
  "Describe a person whose laugh you can still hear in your head.",
  "What's something you do that's deeply you — even if no one else gets it?",
  "Tell me about a season of unlearning, and what you're shedding.",
  "If you could plant one truth in someone's life, what would it be?",
  "Describe a moment you understood that growing up never really ends.",
  "What's a fear you've made smaller by walking toward it?",
  "Tell me about a kindness someone showed you when you didn't think you deserved it.",
  "How do you tell the difference between settling and choosing peace?",
  "Describe how you'd want a stranger to describe you after meeting you once.",
  "What's a way your past has become a strength instead of a burden?",
  "Tell me about a time you trusted timing over urgency.",
  "If you had to pick one moment that shaped your sense of self, which would it be?",
  "Describe what 'enough' looks like for you, on a real day.",
  "What's a question you've been sitting with that hasn't given you an answer yet?",
  "Tell me about a way you'd like to be remembered by one specific person.",
  "How do you take care of yourself in the middle of a hard week?",
  "Describe a part of your life you'd hate to lose to autopilot.",
  "What's a small win this week that meant more than it looked like?",
  "Tell me about a time you felt deeply grateful in the middle of difficulty.",
  "If you could create a holiday that everyone celebrated, what would it honor?",
  "Describe an idea or cause you'd happily lose sleep over.",
  "What's something you do that quietly takes courage every time?",
  "Tell me about a moment you noticed yourself growing in real time.",
  "How do you welcome change when it shows up uninvited?",
  "Describe a piece of advice you'd give yourself one year ago today.",
  "What's a part of your story you used to hide that you're learning to share?",
  "Tell me about a person whose presence makes you a better version of yourself.",
  "If you could ask life one question and get an honest answer, what would you ask?",
  "Describe a moment you chose hope over evidence.",
  "What's a way your definition of family has surprised you?",
  "Tell me about a place that always makes you feel small in the best way.",
  "How do you make decisions when both options feel right?",
  "Describe an everyday miracle you've noticed lately.",
  "What's something you've been brave enough to want out loud?",
  "Tell me about a memory you reach for when you need comfort.",
  "If you could thank someone who'll never know, who would it be and for what?",
  "Describe a way you've grown that feels almost invisible to others.",
  "What's a part of your life you'd protect at any cost?",
  "Tell me about a moment you realized you were allowed to want more.",
  "How do you stay open after being hurt?",
  "Describe a friendship that feels like it's built to last a lifetime.",
  "What's a way you'd like to surprise yourself this year?",
  "Tell me about a piece of music that always makes you feel less alone.",
  "If you could write one sentence on a wall the world would see, what would it say?",
  "Describe a strength you didn't know you had until life asked for it.",
  "What's a moment you'd describe as the start of believing in yourself?",
  "Tell me about something you've been quietly hoping for.",
  "How do you keep faith in people when they disappoint you?",
  "Describe a way you've made your life smaller in order to make it deeper.",
  "What's a question you'd love to be asked at the dinner table tonight?",
  "Tell me about a moment you realized you were exactly where you needed to be.",
  "If you had a free hour with no responsibilities right now, how would you actually spend it?",
  "Describe what gratitude has taught you that nothing else could.",
  "What's a part of your life right now that you'll one day miss?",
  "Tell me about something you're letting yourself want without apology.",
  "How would you describe the kind of love you're learning to give?",
  "Describe a way the world has surprised you for the better lately.",
  "What's a moment you'd like to capture in a single, perfect photograph?",
  "Tell me about a tradition you've outgrown and what's replacing it.",
  "If you could send a postcard from your future self, what would it say?",
  "Describe a piece of your story you used to be ashamed of and now find beautiful.",
  "What's something you'd defend in court if your life were on the line?",
  "Tell me about a moment you let yourself fully feel something instead of pushing it away.",
  "How do you want to be a little different one year from today?",
];

// Use UTC date to ensure all users get the same prompt on the same day
const getDailyPrompt = () => {
  const now = new Date();
  const utcYear = now.getUTCFullYear();
  const utcMonth = now.getUTCMonth();
  const utcDate = now.getUTCDate();
  
  // Calculate day of year in UTC
  const startOfYear = Date.UTC(utcYear, 0, 0);
  const currentDay = Date.UTC(utcYear, utcMonth, utcDate);
  const dayOfYear = Math.floor((currentDay - startOfYear) / 86400000);
  
  return DAILY_PROMPTS[dayOfYear % DAILY_PROMPTS.length];
};

// Use UTC date string for consistency across timezones
const getTodayDateString = () => {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-${String(now.getUTCDate()).padStart(2, '0')}`;
};

interface DailyScopeCompletion {
  id: string;
  rating: number;
  analysis_result: any;
  transcript: string | null;
  prompt: string;
  created_at: string;
}

const Index = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState("");
  const [todayCompletion, setTodayCompletion] = useState<DailyScopeCompletion | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [loadingCompletion, setLoadingCompletion] = useState(true);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    fetchProfile();
    checkTodayCompletion();
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      setDisplayName(data?.display_name || "");
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  const checkTodayCompletion = async () => {
    if (!user) {
      setLoadingCompletion(false);
      return;
    }
    try {
      const today = getTodayDateString();
      const { data, error } = await supabase
        .from("daily_scope_completions")
        .select("*")
        .eq("user_id", user.id)
        .eq("prompt_date", today)
        .maybeSingle();

      if (error) throw error;
      setTodayCompletion(data);
    } catch (error) {
      console.error("Error checking today's completion:", error);
    } finally {
      setLoadingCompletion(false);
    }
  };

  const getGreetingName = () => {
    if (displayName) return displayName;
    if (user?.email) return user.email.split("@")[0];
    return "";
  };

  const handleCancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsProcessing(false);
    toast.info("Analysis cancelled");
  }, []);

  const handleRecordingComplete = async (audioBlob: Blob, fileName: string) => {
    if (!user) {
      toast.error("You must be logged in");
      return;
    }

    abortControllerRef.current = new AbortController();
    setIsProcessing(true);
    const dailyPrompt = getDailyPrompt();

    try {
      // Step 1: Transcribe
      toast.info("Transcribing your response...");
      const transcript = await transcribeAudio(audioBlob);

      // Check if cancelled
      if (abortControllerRef.current?.signal.aborted) {
        return;
      }

      if (!transcript || transcript.trim().length === 0) {
        throw new Error("Could not transcribe audio");
      }

      // Step 2: Analyze monologue
      toast.info("Analyzing your response...");
      const { data: analysisData, error: analysisError } = await supabase.functions.invoke(
        "analyze-monologue",
        {
          body: { transcript, prompt: dailyPrompt },
        }
      );

      // Check if cancelled
      if (abortControllerRef.current?.signal.aborted) {
        return;
      }

      if (analysisError) throw analysisError;
      if (analysisData.error) throw new Error(analysisData.error);

      // Step 3: Save completion
      const { error: insertError } = await supabase.from("daily_scope_completions").insert({
        user_id: user.id,
        prompt: dailyPrompt,
        prompt_date: getTodayDateString(),
        rating: analysisData.rating || 70,
        analysis_result: analysisData,
        transcript: transcript,
      });

      if (insertError) throw insertError;

      // Refresh to show completed state
      await checkTodayCompletion();
      toast.success("Daily Scope completed!");
    } catch (error: any) {
      // Don't show error if cancelled
      if (abortControllerRef.current?.signal.aborted) {
        return;
      }
      console.error("Error processing daily scope:", error);
      toast.error(error.message || "Failed to process recording");
    } finally {
      setIsProcessing(false);
    }
  };

  const dailyPrompt = getDailyPrompt();

  return (
    <ProFeatureGate 
      featureName="Daily Scope" 
      description="Practice your communication skills with daily prompts and get AI-powered feedback."
    >
      <div className="min-h-screen bg-background">
        {/* Background Effects */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 min-h-screen flex flex-col">
          {/* Fixed Header */}
          <header className="fixed-header bg-background/95 backdrop-blur-lg border-b border-primary/10">
            <div className="px-4 py-3">
              <div className="flex items-center justify-between">
                <Link to="/record" className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity">
                  <div className="w-9 h-9 rounded-xl bg-gradient-primary flex items-center justify-center glow-primary">
                    <AudioWaveform className="w-4 h-4 text-primary-foreground" />
                  </div>
                  <div>
                    <h1 className="text-base font-serif font-semibold text-foreground">
                      SocialScope
                    </h1>
                    <p className="text-[9px] text-muted-foreground">
                      AI-Powered Conversation Coach
                    </p>
                  </div>
                </Link>

                <HeaderNav isAnalyzing={isProcessing} />
              </div>
            </div>
            <div className="h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
          </header>

          {/* Spacer for fixed header */}
          <div className="h-[60px] safe-area-top flex-shrink-0" />

          {/* Main Content */}
          <main className="px-4 md:px-8 py-6 md:py-10 pb-28 space-y-6 max-w-4xl mx-auto flex-1">
            {/* Welcome Section */}
            <section className="text-center space-y-1 animate-fade-in">
              <h2 className="md:text-2xl font-serif text-foreground text-2xl">
                Welcome back{getGreetingName() ? `, ${getGreetingName()}` : ""}
              </h2>
            </section>

            {/* Daily Scope Prompt */}
            <section className="animate-fade-in" style={{ animationDelay: "0.1s" }}>
              <div className="rounded-2xl bg-card border border-primary/20 p-5 md:p-6 text-center space-y-1 transition-all duration-200 hover:border-primary/40 hover:shadow-[0_0_20px_rgba(247,165,58,0.1)]">
                <h3 className="text-lg md:text-xl font-serif font-semibold text-foreground">
                  Daily Scope
                </h3>
                <p className="text-muted-foreground md:text-base text-lg">{dailyPrompt}</p>
              </div>
            </section>

            {/* Recording Section or Completed State */}
            <section className="animate-fade-in" style={{ animationDelay: "0.2s" }}>
              {loadingCompletion ? (
                <div className="rounded-2xl bg-card border border-primary/20 p-6 md:p-8 text-center">
                  <div className="animate-pulse text-muted-foreground">Loading...</div>
                </div>
              ) : todayCompletion ? (
                <DailyScopeAnalysis completion={todayCompletion} />
              ) : (
                <div className="rounded-2xl bg-gradient-to-br from-primary/10 via-card to-accent/10 border border-primary/20 p-6 md:p-8 space-y-5 transition-all duration-200 hover:border-primary/40 hover:shadow-[0_0_20px_rgba(247,165,58,0.1)]">
                  <div className="text-center space-y-3">
                    <div className="w-16 h-16 rounded-full bg-gradient-primary mx-auto flex items-center justify-center glow-primary">
                      <Mic className="w-8 h-8 text-primary-foreground" />
                    </div>
                    <h3 className="text-lg md:text-xl font-serif text-foreground">
                      Answer the Daily Scope
                    </h3>
                    <p className="text-sm text-muted-foreground">Your 60 seconds of clarity</p>
                  </div>

                  {isProcessing ? (
                    <div className="text-center py-8 space-y-4">
                      <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
                      <p className="text-muted-foreground">Processing your response...</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCancel}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <HomeRecorder onRecordingComplete={handleRecordingComplete} />
                  )}
                </div>
              )}
            </section>
          </main>
        </div>
      </div>
    </ProFeatureGate>
  );
};

export default Index;
