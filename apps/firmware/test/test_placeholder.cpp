#include <unity.h>

void test_placeholder() {
  TEST_ASSERT_TRUE(true);
}

int main(int argc, char **argv) {
  UNITY_BEGIN();
  RUN_TEST(test_placeholder);
  return UNITY_END();
}
